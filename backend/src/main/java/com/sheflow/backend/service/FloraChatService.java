package com.sheflow.backend.service;

import com.sheflow.backend.dto.ChatMessageDto;
import com.sheflow.backend.entity.ChatMessage;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.flora.FloraKnowledgeDoc;
import com.sheflow.backend.flora.FloraLlmService;
import com.sheflow.backend.flora.FloraMedicalSafetyService;
import com.sheflow.backend.flora.FloraRagService;
import com.sheflow.backend.flora.FloraUserContextService;
import com.sheflow.backend.repository.ChatMessageRepository;
import com.sheflow.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FloraChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final FloraRagService ragService;
    private final FloraMedicalSafetyService safetyService;
    private final FloraUserContextService userContextService;
    private final FloraLlmService llmService;

    public FloraChatService(
        ChatMessageRepository chatMessageRepository,
        UserRepository userRepository,
        FloraRagService ragService,
        FloraMedicalSafetyService safetyService,
        FloraUserContextService userContextService,
        FloraLlmService llmService
    ) {
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.ragService = ragService;
        this.safetyService = safetyService;
        this.userContextService = userContextService;
        this.llmService = llmService;
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getChatHistory(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return chatMessageRepository.findByUserIdOrderByCreatedAtAsc(user.getId())
            .stream()
            .map(m -> ChatMessageDto.builder()
                .id(m.getId())
                .sender(m.getSender())
                .content(m.getContent())
                .timestamp(m.getTimestamp())
                .build())
            .collect(Collectors.toList());
    }

    @Transactional(rollbackFor = Exception.class)
    public Map<String, ChatMessageDto> processMessage(String email, String content) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String timeStr = LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a"));

        // 1. Save User Message
        ChatMessage userMsg = chatMessageRepository.save(ChatMessage.builder()
            .user(user)
            .sender("USER")
            .content(content)
            .timestamp(timeStr)
            .build());

        // 2. Pre-Generation Medical Safety Check
        FloraMedicalSafetyService.SafetyCheckResult safetyResult = safetyService.checkPreGenerationSafety(content);

        String reply;
        List<String> sourceCitations = Collections.emptyList();
        String safetyNotice = null;
        boolean isEmergency = false;

        if (safetyResult.isEmergency()) {
            isEmergency = true;
            safetyNotice = safetyResult.emergencyNotice();
            reply = safetyResult.emergencyNotice();
        } else {
            // 3. User Context Retrieval (Anonymized & strictly permissioned)
            FloraUserContextService.AnonymizedUserCycleContext userContext = userContextService.buildUserContext(user);

            // 4. Grounded RAG Retrieval
            List<FloraKnowledgeDoc> relevantDocs = ragService.retrieveRelevantDocs(content, 2);
            sourceCitations = relevantDocs.stream()
                .map(d -> d.getTitle() + " (" + d.getPublisher() + ")")
                .collect(Collectors.toList());

            // 5. LLM Inference
            FloraLlmService.LlmGenerationResult genResult = llmService.generateReply(content, userContext, relevantDocs);

            // 6. Post-Generation Safety Guardrails
            reply = safetyService.applyPostGenerationGuardrails(genResult.reply());
        }

        // 7. Save Flora Reply
        ChatMessage floraMsg = chatMessageRepository.save(ChatMessage.builder()
            .user(user)
            .sender("FLORA")
            .content(reply)
            .timestamp(timeStr)
            .build());

        ChatMessageDto userDto = ChatMessageDto.builder()
            .id(userMsg.getId())
            .sender("USER")
            .content(content)
            .timestamp(timeStr)
            .build();

        ChatMessageDto floraDto = ChatMessageDto.builder()
            .id(floraMsg.getId())
            .sender("FLORA")
            .content(reply)
            .timestamp(timeStr)
            .sources(sourceCitations)
            .safetyNotice(safetyNotice)
            .isEmergency(isEmergency)
            .build();

        return Map.of(
            "userMessage", userDto,
            "floraReply", floraDto
        );
    }

    @Transactional(rollbackFor = Exception.class)
    public void clearChatHistory(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        List<ChatMessage> messages = chatMessageRepository.findByUserIdOrderByCreatedAtAsc(user.getId());
        chatMessageRepository.deleteAll(messages);
    }
}
