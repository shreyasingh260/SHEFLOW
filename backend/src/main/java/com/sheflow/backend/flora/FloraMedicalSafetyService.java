package com.sheflow.backend.flora;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

@Service
public class FloraMedicalSafetyService {

    public record SafetyCheckResult(
        boolean isEmergency,
        String emergencyNotice,
        String category
    ) {}

    // Patterns for emergency red flags
    private static final List<Pattern> HEMORRHAGE_PATTERNS = List.of(
        Pattern.compile("\\b(soak|soaking)\\b.*\\b(hour|pad|tampon)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(pad|tampon)\\b.*\\b(every hour|each hour|1 hour)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(huge|large|big)\\s+(clot|clots)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(uncontrolled|excessive|severe)\\s+(bleeding|hemorrhage|blood)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\bbahut\\s+zyada\\s+khoon\\b", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Pattern> ACUTE_PAIN_PATTERNS = List.of(
        Pattern.compile("\\b(unbearable|excruciating|severe|acute|sharp|stabbing|worst)\\b.*\\b(pain|cramp|cramps|dard)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(pain|cramp|cramps|dard)\\b.*\\b(cannot|can't|unable to)\\s+(walk|stand|move)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(cannot|can't|unable to)\\s+(walk|stand|move)\\b.*\\b(pain|cramp|cramps|dard)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\bbahut\\s+tez\\s+dard\\b", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Pattern> INFECTION_PATTERNS = List.of(
        Pattern.compile("\\b(fever|chills)\\b.*\\b(pelvic|discharge|smell|foul)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(foul|smelly|bad)\\s+discharge\\b.*\\b(fever|pain)\\b", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Pattern> SYNCOPE_PATTERNS = List.of(
        Pattern.compile("\\b(faint|fainted|fainting|blackout|passed out|collapse)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\bchakkar\\s+aa\\s+gaya\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\bbehosh\\b", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Pattern> PREGNANCY_EMERGENCY_PATTERNS = List.of(
        Pattern.compile("\\b(pregnant|positive test)\\b.*\\b(bleeding|spotting|sharp pain)\\b", Pattern.CASE_INSENSITIVE),
        Pattern.compile("\\b(bleeding|sharp pain)\\b.*\\b(pregnant|positive test)\\b", Pattern.CASE_INSENSITIVE)
    );

    /**
     * Pre-generation deterministic triage check.
     */
    public SafetyCheckResult checkPreGenerationSafety(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return new SafetyCheckResult(false, null, "NORMAL");
        }

        // 1. Severe Hemorrhage Check
        for (Pattern p : HEMORRHAGE_PATTERNS) {
            if (p.matcher(userMessage).find()) {
                return new SafetyCheckResult(
                    true,
                    "⚠️ URGENT CLINICAL NOTICE: Soaking through one or more pads/tampons every hour or passing unusually large clots can indicate severe menorrhagia or hemorrhage. Please rest immediately and seek emergency medical evaluation or contact National Women Helpline (1091) / Emergency (112).",
                    "HEMORRHAGE"
                );
            }
        }

        // 2. Acute Unbearable Pain Check
        for (Pattern p : ACUTE_PAIN_PATTERNS) {
            if (p.matcher(userMessage).find()) {
                return new SafetyCheckResult(
                    true,
                    "⚠️ URGENT CLINICAL NOTICE: Severe, sudden, or excruciating pelvic pain that impairs walking or standing requires immediate in-person gynecological or emergency assessment to rule out conditions such as ovarian torsion, ruptured cysts, or pelvic infection.",
                    "ACUTE_PAIN"
                );
            }
        }

        // 3. Pregnancy + Pain/Bleeding Check (Ectopic Risk)
        for (Pattern p : PREGNANCY_EMERGENCY_PATTERNS) {
            if (p.matcher(userMessage).find()) {
                return new SafetyCheckResult(
                    true,
                    "⚠️ URGENT CLINICAL NOTICE: Bleeding or unilateral pelvic pain during a confirmed or suspected pregnancy requires immediate emergency evaluation to rule out ectopic pregnancy or gestational complications.",
                    "PREGNANCY_COMPLICATION"
                );
            }
        }

        // 4. Syncope Check
        for (Pattern p : SYNCOPE_PATTERNS) {
            if (p.matcher(userMessage).find()) {
                return new SafetyCheckResult(
                    true,
                    "⚠️ URGENT CLINICAL NOTICE: Fainting or collapse during menstruation can result from acute hypovolemia, severe blood loss, or vasovagal shock. Please sit or lie down with legs elevated and have someone escort you to urgent medical care.",
                    "SYNCOPE"
                );
            }
        }

        // 5. Systemic Infection Check
        for (Pattern p : INFECTION_PATTERNS) {
            if (p.matcher(userMessage).find()) {
                return new SafetyCheckResult(
                    true,
                    "⚠️ URGENT CLINICAL NOTICE: High fever accompanied by pelvic pain or foul-smelling discharge may indicate pelvic inflammatory disease (PID) or bacterial infection. Prompt evaluation and clinical antibiotics are essential.",
                    "INFECTION"
                );
            }
        }

        return new SafetyCheckResult(false, null, "NORMAL");
    }

    /**
     * Post-generation guardrails check.
     */
    public String applyPostGenerationGuardrails(String llmReply) {
        if (llmReply == null) return "";

        String sanitized = llmReply;

        // Block definitive medical diagnosis statements
        sanitized = sanitized.replaceAll("(?i)\\byou definitely have (pcos|pcod|endometriosis|fibroids)\\b",
            "these symptoms are commonly discussed in relation to $1, though only a clinical specialist can provide an accurate diagnosis");

        sanitized = sanitized.replaceAll("(?i)\\byou have (pcos|pcod|endometriosis|fibroids)\\b",
            "these signs could be associated with $1; a doctor's examination is recommended");

        // Block calendar contraception guarantees
        sanitized = sanitized.replaceAll("(?i)\\byou cannot get pregnant (today|now|on day \\d+)\\b",
            "ovulation dates can vary naturally, so calendar dates should not be relied upon as guaranteed contraception");

        // Block advice to stop medication
        sanitized = sanitized.replaceAll("(?i)\\bstop taking your (medication|medicine|prescription)\\b",
            "consult your prescribing physician before modifying any medication");

        return sanitized;
    }
}
