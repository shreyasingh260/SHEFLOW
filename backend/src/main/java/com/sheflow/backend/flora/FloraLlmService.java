package com.sheflow.backend.flora;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class FloraLlmService {

    private static final Logger log = LoggerFactory.getLogger(FloraLlmService.class);

    private final String baseUrl;
    private final String apiKey;
    private final String model;
    private final boolean enabled;
    private final RestTemplate restTemplate;

    public FloraLlmService(
        RestTemplateBuilder restTemplateBuilder,
        @Value("${app.flora.ai.base-url:https://api.together.xyz/v1}") String baseUrl,
        @Value("${app.flora.ai.api-key:}") String apiKey,
        @Value("${app.flora.ai.model:gpt-oss-20b}") String model,
        @Value("${app.flora.ai.timeout-ms:8000}") long timeoutMs,
        @Value("${app.flora.ai.enabled:true}") boolean enabled
    ) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiKey = apiKey;
        this.model = model;
        this.enabled = enabled;
        this.restTemplate = restTemplateBuilder
            .setConnectTimeout(Duration.ofMillis(timeoutMs))
            .setReadTimeout(Duration.ofMillis(timeoutMs))
            .build();
    }

    public record LlmGenerationResult(
        String reply,
        String modelUsed,
        boolean isFallback
    ) {}

    public LlmGenerationResult generateReply(
        String userMessage,
        FloraUserContextService.AnonymizedUserCycleContext userContext,
        List<FloraKnowledgeDoc> retrievedDocs
    ) {
        // If API key is not configured or disabled, use our grounded offline engine
        if (!enabled || apiKey == null || apiKey.isBlank()) {
            return generateGroundedFallback(userMessage, userContext, retrievedDocs);
        }

        try {
            String systemPrompt = buildSystemPrompt(userContext, retrievedDocs);

            Map<String, Object> requestBody = Map.of(
                "model", model,
                "messages", List.of(
                    Map.of("role", "system", "content", systemPrompt),
                    Map.of("role", "user", "content", userMessage)
                ),
                "temperature", 0.3,
                "max_tokens", 512
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            String endpoint = baseUrl + "/chat/completions";
            ResponseEntity<OpenAiChatResponse> response = restTemplate.postForEntity(
                endpoint,
                entity,
                OpenAiChatResponse.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Choice> choices = response.getBody().choices;
                if (choices != null && !choices.isEmpty() && choices.get(0).message != null) {
                    String content = choices.get(0).message.content;
                    return new LlmGenerationResult(content.trim(), model, false);
                }
            }

            log.warn("Empty or non-200 response from LLM provider: {}. Falling back to grounded response.", response.getStatusCode());
        } catch (Exception ex) {
            log.warn("LLM generation request failed ({}: {}). Employing grounded fallback engine.", ex.getClass().getSimpleName(), ex.getMessage());
        }

        return generateGroundedFallback(userMessage, userContext, retrievedDocs);
    }

    private String buildSystemPrompt(
        FloraUserContextService.AnonymizedUserCycleContext userContext,
        List<FloraKnowledgeDoc> retrievedDocs
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are Flora, a warm, supportive, empathetic, and knowledgeable menstrual-health companion inside the SheFlow app.\n");
        sb.append("Your role is to educate, provide comfort, and explain menstrual physiology. You are NOT a doctor and cannot diagnose medical conditions.\n\n");

        sb.append("GUIDELINES:\n");
        sb.append("1. Tone: Warm, validating, non-judgmental, clear, and reassuring without false promises.\n");
        sb.append("2. Language: Mirror the user's language. If they write in English, reply in English. If they write in Hinglish (e.g., 'mujhe cramps ho rahe hain'), reply naturally in warm Hinglish with helpful advice.\n");
        sb.append("3. Medical Safety: Never diagnose a disease (e.g., never say 'You have PCOS'). Never recommend stopping prescribed medications. Never claim calendar predictions guarantee birth control.\n");
        sb.append("4. Distinguish Data Types:\n");
        sb.append("   - Recorded: past logged dates and symptoms.\n");
        sb.append("   - Calculated: current cycle day and cycle length.\n");
        sb.append("   - Estimated: predicted next period date and fertile window (always clarify these are statistical estimations).\n\n");

        sb.append(userContext.toPromptString()).append("\n");

        sb.append("--- APPROVED CLINICAL RAG EVIDENCE ---\n");
        if (retrievedDocs.isEmpty()) {
            sb.append("Standard clinical guidance on menstrual self-care, hydration, and gentle movement.\n");
        } else {
            for (FloraKnowledgeDoc doc : retrievedDocs) {
                sb.append("• [").append(doc.getDocId()).append("] ").append(doc.getTitle()).append(" (Source: ").append(doc.getPublisher()).append("):\n");
                sb.append("  ").append(doc.getContent()).append("\n\n");
            }
        }
        sb.append("--------------------------------------\n\n");
        sb.append("Answer the user concisely (under 120 words), grounding your answer in the clinical evidence and their current cycle context.");
        return sb.toString();
    }

    /**
     * Grounded, context-aware fallback response generation when cloud LLM is offline or unconfigured.
     */
    private LlmGenerationResult generateGroundedFallback(
        String userMessage,
        FloraUserContextService.AnonymizedUserCycleContext userContext,
        List<FloraKnowledgeDoc> docs
    ) {
        String lower = userMessage.toLowerCase();
        boolean isHinglish = lower.contains("hai") || lower.contains("kya") || lower.contains("dard") || lower.contains("mujhe") || lower.contains("mera") || lower.contains("pet");

        StringBuilder reply = new StringBuilder();

        // 1. Cramps / Pain
        if (lower.contains("cramp") || lower.contains("pain") || lower.contains("ache") || lower.contains("dard")) {
            if (isHinglish) {
                reply.append("Aapki cycle ke hisab se (Day ").append(userContext.currentCycleDay()).append(", ").append(userContext.cyclePhase()).append("), ");
                reply.append("uterine contractions aur prostaglandins ki wajah se cramps ho sakte hain. ");
                reply.append("Comfort ke liye 15-20 minute ke liye lower belly par heat pad lagayein, adrak (ginger) ki chai piyein, aur deep breathing karein. ");
                reply.append("Agar dard severe ho ya painkillers se theek na ho, toh doctor se zaroor consult karein.");
            } else {
                reply.append("Based on your cycle (Day ").append(userContext.currentCycleDay()).append(", ").append(userContext.cyclePhase()).append("), ");
                reply.append("cramps are naturally driven by prostaglandins stimulating uterine muscles. ");
                reply.append("Applying a heating pad (around 40°C) for 15-20 minutes, gentle child's pose stretching, and sipping warm ginger tea can bring soothing comfort. ");
                reply.append("If pain becomes severe or unmanageable, please consult your gynecologist.");
            }
            return new LlmGenerationResult(reply.toString(), "flora-rag-engine", true);
        }

        // 2. Cycle Phase / Predictions
        if (lower.contains("phase") || lower.contains("predict") || lower.contains("period") || lower.contains("next") || lower.contains("kab")) {
            if (isHinglish) {
                reply.append("Aapka estimated cycle phase abhi **").append(userContext.cyclePhase()).append("** hai (Day ").append(userContext.currentCycleDay()).append("). ");
                reply.append("Aapka agla period approximately **").append(userContext.predictedNextPeriodDate()).append("** ko expected hai (~").append(userContext.daysUntilNextPeriod()).append(" din baad). ");
                reply.append("Dhayan rahe ki yeh statistical estimate hai aur natural cycle variation ki wajah se 2-3 din aage-peeche ho sakta hai.");
            } else {
                reply.append("You are currently in your estimated **").append(userContext.cyclePhase()).append("** (Day ").append(userContext.currentCycleDay()).append("). ");
                reply.append("Your next period is predicted for **").append(userContext.predictedNextPeriodDate()).append("** (approximately ").append(userContext.daysUntilNextPeriod()).append(" days away). ");
                reply.append("Please note this is a statistical estimate based on your logged history; natural variations can shift dates by a few days.");
            }
            return new LlmGenerationResult(reply.toString(), "flora-rag-engine", true);
        }

        // 3. Fertility / Ovulation
        if (lower.contains("ovulat") || lower.contains("fertile") || lower.contains("pregnant") || lower.contains("pregnancy")) {
            if (isHinglish) {
                reply.append("Aapki estimated fertile window **").append(userContext.estimatedFertileWindow()).append("** ke aas-paas hai. ");
                reply.append("Fertile window ovulation se lagbhag 5 din pehle aur ovulation ke din tak hoti hai. ");
                reply.append("Kripya dhayan dein: calendar predictions contraceptive guarantee nahi hoti. Family planning ke liye specialist se salah lein.");
            } else {
                reply.append("Your estimated fertile window spans **").append(userContext.estimatedFertileWindow()).append("**. ");
                reply.append("The biological fertile window typically includes the 5 days leading up to ovulation plus ovulation day itself. ");
                reply.append("Important reminder: Calendar calculations are statistical estimations, not confirmed birth control or clinical diagnosis.");
            }
            return new LlmGenerationResult(reply.toString(), "flora-rag-engine", true);
        }

        // 4. Food / Nutrition / Exercise
        if (lower.contains("food") || lower.contains("eat") || lower.contains("diet") || lower.contains("exercise") || lower.contains("workout") || lower.contains("khana")) {
            if (isHinglish) {
                reply.append("Aapke ").append(userContext.cyclePhase()).append(" ke dauran hydration aur balanced nutrition zaroori hai. ");
                reply.append("Iron-rich spinach, daal, aur magnesium-rich pumpkin seeds muscle relaxation mein madad karte hain. ");
                reply.append("Light movement jaise 20-minute walk ya restorative yoga circulation ko boost karta hai.");
            } else {
                reply.append("During your ").append(userContext.cyclePhase()).append(", nourishing your body with iron-rich foods (spinach, lentils) and magnesium (pumpkin seeds, 70%+ dark chocolate) supports muscle comfort. ");
                reply.append("Gentle physical activity like brisk walking or restorative stretching elevates endorphins without stressing your body.");
            }
            return new LlmGenerationResult(reply.toString(), "flora-rag-engine", true);
        }

        // 5. General Evidence Grounded Default
        if (!docs.isEmpty()) {
            FloraKnowledgeDoc top = docs.get(0);
            if (isHinglish) {
                reply.append("Aapke sawal ke sandarbh mein: ").append(top.getContent().substring(0, Math.min(220, top.getContent().length()))).append("... ");
                reply.append("SheFlow par aapki cycle status (Day ").append(userContext.currentCycleDay()).append(") ke mutabiq hydration aur rest maintain karein.");
            } else {
                reply.append(top.getContent().substring(0, Math.min(240, top.getContent().length()))).append("... ");
                reply.append("Staying in tune with your body on Day ").append(userContext.currentCycleDay()).append(" (").append(userContext.cyclePhase()).append(") helps maintain hormonal balance.");
            }
            return new LlmGenerationResult(reply.toString(), "flora-rag-engine", true);
        }

        String fallback = isHinglish
            ? "Main hamesha aapke sath hoon! Day " + userContext.currentCycleDay() + " (" + userContext.cyclePhase() + ") par paani peena, proper aaram lena aur apne sharir ki sunna sabse ahem hai. Main aapki aur kya madad kar sakti hoon?"
            : "I'm right here with you! During Day " + userContext.currentCycleDay() + " (" + userContext.cyclePhase() + "), staying hydrated, resting adequately, and tuning into your body's signals makes every day smoother. How else can I support you today?";
        return new LlmGenerationResult(fallback, "flora-default-engine", true);
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class OpenAiChatResponse {
        @JsonProperty("choices")
        public List<Choice> choices;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class Choice {
        @JsonProperty("message")
        public Message message;
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private static class Message {
        @JsonProperty("content")
        public String content;
    }
}
