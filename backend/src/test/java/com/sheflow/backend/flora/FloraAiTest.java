package com.sheflow.backend.flora;

import com.sheflow.backend.dto.ChatMessageDto;
import com.sheflow.backend.entity.PeriodLog;
import com.sheflow.backend.entity.User;
import com.sheflow.backend.repository.ChatMessageRepository;
import com.sheflow.backend.repository.PeriodLogRepository;
import com.sheflow.backend.repository.UserRepository;
import com.sheflow.backend.service.FloraChatService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class FloraAiTest {

    @Autowired
    private FloraChatService floraChatService;

    @Autowired
    private FloraMedicalSafetyService safetyService;

    @Autowired
    private FloraRagService ragService;

    @Autowired
    private FloraUserContextService userContextService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PeriodLogRepository periodLogRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUserA;
    private User testUserB;

    @BeforeEach
    void setup() {
        chatMessageRepository.deleteAll();

        testUserA = userRepository.save(User.builder()
            .fullName("Ananya Sharma")
            .email("ananya_test@example.com")
            .password(passwordEncoder.encode("Password@123"))
            .cycleLengthDays(28)
            .periodLengthDays(5)
            .lastPeriodStart(LocalDate.now().minusDays(14)) // Exactly Day 15 (Ovulation Phase)
            .regularity("REGULAR")
            .waterGoalGlasses(8)
            .onboardingDone(true)
            .build());

        periodLogRepository.save(PeriodLog.builder()
            .user(testUserA)
            .startDate(LocalDate.now().minusDays(14))
            .endDate(LocalDate.now().minusDays(9))
            .flowIntensity("MEDIUM")
            .notes("Period started on time")
            .build());

        testUserB = userRepository.save(User.builder()
            .fullName("Pooja Verma")
            .email("pooja_test@example.com")
            .password(passwordEncoder.encode("Password@123"))
            .cycleLengthDays(32)
            .periodLengthDays(6)
            .lastPeriodStart(LocalDate.now().minusDays(3)) // Day 4 (Menstrual Phase)
            .regularity("IRREGULAR")
            .onboardingDone(true)
            .build());
    }

    @Test
    @DisplayName("RAG Corpus Retrieval: Retrieves approved clinical guidelines for cramps and PMS")
    void testRagRetrieval() {
        List<FloraKnowledgeDoc> docs = ragService.retrieveRelevantDocs("Why do I get severe cramps during my period?", 2);
        assertFalse(docs.isEmpty(), "Should retrieve at least one approved clinical document");
        assertEquals("DOC-DYSMENORRHEA-01", docs.get(0).getDocId());
        assertTrue(docs.get(0).getContent().contains("prostaglandins"));
        assertTrue(docs.get(0).getPublisher().contains("ACOG"));
    }

    @Test
    @DisplayName("Safety Pre-Triage: Detects severe hemorrhage red flag deterministically")
    void testSevereHemorrhageTriage() {
        FloraMedicalSafetyService.SafetyCheckResult result = safetyService.checkPreGenerationSafety(
            "I am soaking through a pad every hour and passing huge clots"
        );
        assertTrue(result.isEmergency(), "Hemorrhage pattern must trigger emergency triage");
        assertEquals("HEMORRHAGE", result.category());
        assertTrue(result.emergencyNotice().contains("URGENT CLINICAL NOTICE"));
        assertTrue(result.emergencyNotice().contains("1091"));
    }

    @Test
    @DisplayName("Safety Pre-Triage: Detects acute unbearable pelvic pain deterministically")
    void testAcutePainTriage() {
        FloraMedicalSafetyService.SafetyCheckResult result = safetyService.checkPreGenerationSafety(
            "I have unbearable excruciating pelvic pain and can't walk"
        );
        assertTrue(result.isEmergency());
        assertEquals("ACUTE_PAIN", result.category());
        assertTrue(result.emergencyNotice().contains("URGENT CLINICAL NOTICE"));
    }

    @Test
    @DisplayName("Safety Pre-Triage: Detects pregnancy bleeding/pain (ectopic risk)")
    void testPregnancyComplicationTriage() {
        FloraMedicalSafetyService.SafetyCheckResult result = safetyService.checkPreGenerationSafety(
            "I am pregnant and have sharp bleeding"
        );
        assertTrue(result.isEmergency());
        assertEquals("PREGNANCY_COMPLICATION", result.category());
    }

    @Test
    @DisplayName("Safety Post-Generation: Prevents definitive medical diagnoses")
    void testPostGenerationDiagnosisSanitization() {
        String unsafeLlmReply = "Based on your symptoms, you definitely have PCOS and endometriosis.";
        String sanitized = safetyService.applyPostGenerationGuardrails(unsafeLlmReply);
        assertFalse(sanitized.contains("you definitely have PCOS"));
        assertTrue(sanitized.contains("only a clinical specialist can provide an accurate diagnosis"));
    }

    @Test
    @DisplayName("Safety Post-Generation: Blocks calendar contraception guarantees")
    void testPostGenerationContraceptionSanitization() {
        String unsafeLlmReply = "You cannot get pregnant on day 22 because ovulation passed.";
        String sanitized = safetyService.applyPostGenerationGuardrails(unsafeLlmReply);
        assertFalse(sanitized.contains("You cannot get pregnant"));
        assertTrue(sanitized.contains("should not be relied upon as guaranteed contraception"));
    }

    @Test
    @DisplayName("Personalized Cycle Grounding: Correctly injects User A's single-source-of-truth cycle data")
    void testUserContextGrounding() {
        FloraUserContextService.AnonymizedUserCycleContext ctx = userContextService.buildUserContext(testUserA);
        assertEquals("Ovulation Phase", ctx.cyclePhase());
        assertEquals(15, ctx.currentCycleDay());
        assertFalse(ctx.isIrregular());
        assertNotNull(ctx.predictedNextPeriodDate());
    }

    @Test
    @DisplayName("Flora Chat Flow: English menstrual health inquiry returns grounded advice with citations")
    void testProcessMessageEnglish() {
        Map<String, ChatMessageDto> res = floraChatService.processMessage(testUserA.getEmail(), "Why am I having cramps today?");
        assertNotNull(res);
        ChatMessageDto reply = res.get("floraReply");
        assertNotNull(reply);
        assertEquals("FLORA", reply.getSender());
        assertTrue(reply.getContent().toLowerCase().contains("cramp") || reply.getContent().toLowerCase().contains("prostaglandin"));
        assertNotNull(reply.getSources());
        assertFalse(reply.getSources().isEmpty(), "Educational reply should cite clinical sources");
    }

    @Test
    @DisplayName("Flora Chat Flow: Hinglish question returns empathetic, natural Hinglish response")
    void testProcessMessageHinglish() {
        Map<String, ChatMessageDto> res = floraChatService.processMessage(testUserA.getEmail(), "Mujhe pet me bahut dard ho raha hai kya karun?");
        assertNotNull(res);
        ChatMessageDto reply = res.get("floraReply");
        assertNotNull(reply);
        assertTrue(reply.getContent().contains("heat pad") || reply.getContent().contains("cramps") || reply.getContent().contains("comfort"),
            "Should provide culturally relevant, empathetic Hinglish guidance");
    }

    @Test
    @DisplayName("Emergency Escalation: Flora overrides LLM when dangerous symptoms are reported")
    void testEmergencyEscalationInChat() {
        Map<String, ChatMessageDto> res = floraChatService.processMessage(
            testUserA.getEmail(),
            "I have been soaking a pad every hour and feeling very dizzy"
        );
        ChatMessageDto reply = res.get("floraReply");
        assertTrue(reply.getIsEmergency());
        assertNotNull(reply.getSafetyNotice());
        assertTrue(reply.getContent().contains("URGENT CLINICAL NOTICE"));
        assertTrue(reply.getContent().contains("1091") || reply.getContent().contains("112"));
    }

    @Test
    @DisplayName("Cross-User Isolation: User B cannot access User A's chat history")
    void testCrossUserDataIsolation() {
        // User A sends message
        floraChatService.processMessage(testUserA.getEmail(), "User A private health question");

        // User B retrieves history
        List<ChatMessageDto> historyB = floraChatService.getChatHistory(testUserB.getEmail());
        assertTrue(historyB.isEmpty(), "User B must NOT see User A's chat history");

        // User A retrieves history
        List<ChatMessageDto> historyA = floraChatService.getChatHistory(testUserA.getEmail());
        assertEquals(2, historyA.size(), "User A should see their 1 user message + 1 flora reply");
    }

    @Test
    @DisplayName("Privacy & Data Deletion: User can completely purge chat records")
    void testClearChatHistory() {
        floraChatService.processMessage(testUserA.getEmail(), "Message to be purged");
        assertEquals(2, floraChatService.getChatHistory(testUserA.getEmail()).size());

        floraChatService.clearChatHistory(testUserA.getEmail());
        assertEquals(0, floraChatService.getChatHistory(testUserA.getEmail()).size());
    }
}
