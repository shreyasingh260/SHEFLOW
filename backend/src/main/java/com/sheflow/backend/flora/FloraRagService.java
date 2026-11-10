package com.sheflow.backend.flora;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class FloraRagService {

    private final List<FloraKnowledgeDoc> knowledgeBase = new ArrayList<>();

    public FloraRagService() {
        initCorpus();
    }

    private void initCorpus() {
        knowledgeBase.add(FloraKnowledgeDoc.builder()
            .docId("DOC-DYSMENORRHEA-01")
            .title("ACOG Clinical FAQ: Dysmenorrhea (Menstrual Cramps)")
            .publisher("American College of Obstetricians and Gynecologists (ACOG)")
            .medicalReviewDate("2024-01-15")
            .category("DYSMENORRHEA")
            .citationUrl("https://www.acog.org/clinical/clinical-guidance/dysmenorrhea")
            .keywords(List.of("cramp", "cramps", "pain", "dysmenorrhea", "ache", "uterus", "prostaglandin", "dard", "pet dard"))
            .content("Primary dysmenorrhea is cramping pain caused by natural uterine muscle contractions stimulated by prostaglandins. Prostaglandin levels are highest on day 1-2 of menstrual flow. Medically supported non-pharmacological comfort measures include applying continuous low-level heat (heat pad at 40°C), drinking warm herbal infusions (ginger, chamomile), gentle pelvic stretches (child's pose), and maintaining hydration. Persistent severe pain unresponsive to OTC pain relief warrants clinical evaluation for secondary causes like endometriosis or fibroids.")
            .build());

        knowledgeBase.add(FloraKnowledgeDoc.builder()
            .docId("DOC-PHASES-02")
            .title("Endocrine Society: Menstrual Cycle Phases & Hormonal Dynamics")
            .publisher("Endocrine Society & NHS Guidelines")
            .medicalReviewDate("2023-11-20")
            .category("CYCLE_PHASES")
            .citationUrl("https://www.endocrine.org/patient-engagement/endocrine-library/menstrual-cycle")
            .keywords(List.of("phase", "phases", "follicular", "luteal", "ovulation", "menstrual", "hormone", "estrogen", "progesterone"))
            .content("The menstrual cycle has four distinct phases: 1) Menstrual Phase (Days 1-5): Low estrogen and progesterone; uterine lining sheds. Rest, hydration, and iron replenishment are prioritized. 2) Follicular Phase (Days 6-13): Rising estradiol boosts energy, focus, and verbal fluency. 3) Ovulation Phase (around Day 14): LH and estrogen surge release a mature oocyte; highest natural vitality and fertile window. 4) Luteal Phase (Days 15-28): Progesterone dominates; basal body temperature rises slightly; may bring water retention, cravings, or PMS.")
            .build());

        knowledgeBase.add(FloraKnowledgeDoc.builder()
            .docId("DOC-OVULATION-FERTILITY-03")
            .title("WHO Guidelines on Ovulation, Fertile Window & Contraceptive Clarity")
            .publisher("World Health Organization (WHO)")
            .medicalReviewDate("2024-03-01")
            .category("FERTILITY")
            .citationUrl("https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception")
            .keywords(List.of("ovulation", "fertile", "fertility", "pregnant", "pregnancy", "conception", "baby", "sex", "garbh"))
            .content("Ovulation is the release of an egg from the ovary, typically occurring 12 to 16 days before the next period starts. The biological fertile window spans 5 days before ovulation plus ovulation day itself (due to sperm viability). Important safety clarification: Calendar estimates and mobile apps calculate statistical fertile approximations, NOT guaranteed birth control. Natural cycle variations can cause ovulation shifts. For reliable contraception or pregnancy planning, consult certified clinical options.")
            .build());

        knowledgeBase.add(FloraKnowledgeDoc.builder()
            .docId("DOC-PMS-BLOAT-04")
            .title("Mayo Clinic: Premenstrual Syndrome (PMS) & Fluid Retention")
            .publisher("Mayo Clinic Clinical Education")
            .medicalReviewDate("2023-09-10")
            .category("PMS_BLOATING")
            .citationUrl("https://www.mayoclinic.org/diseases-conditions/premenstrual-syndrome")
            .keywords(List.of("pms", "bloat", "bloating", "swelling", "mood", "swings", "irritated", "breast", "tenderness", "sujan"))
            .content("Premenstrual syndrome (PMS) occurs during the late luteal phase due to shifting progesterone-to-estrogen ratios and serotonin modulation. Bloating and breast tenderness stem from aldosterone activation promoting mild sodium and water retention. Evidence-based relief includes moderating sodium intake, increasing potassium-rich foods (bananas, sweet potatoes, coconut water), drinking 2-3 liters of water, getting regular aerobic exercise, and ensuring 7-9 hours of restful sleep.")
            .build());

        knowledgeBase.add(FloraKnowledgeDoc.builder()
            .docId("DOC-IRREGULAR-PCOS-05")
            .title("RCOG Green-top Guideline: Oligomenorrhea, PCOS & Endometriosis")
            .publisher("Royal College of Obstetricians and Gynaecologists (RCOG)")
            .medicalReviewDate("2023-12-05")
            .category("IRREGULARITY")
            .citationUrl("https://www.rcog.org.uk/guidance/browse-all-guidance/green-top-guidelines")
            .keywords(List.of("irregular", "pcos", "pcod", "endometriosis", "delay", "late", "missed", "der", "chhoot gaya"))
            .content("A normal adult menstrual cycle lasts between 21 and 35 days. Cycle length variations of 2-7 days occasionally occur due to travel, acute stress, thyroid fluctuations, or illness. However, chronic cycle lengths exceeding 38 days (oligomenorrhea) or missed periods for 3 consecutive cycles require medical evaluation. Polycystic Ovary Syndrome (PCOS) involves hyperandrogenism, irregular ovulation, or polycystic ovaries. Definitive diagnosis requires hormonal blood profiles and pelvic ultrasound by a gynecologist.")
            .build());

        knowledgeBase.add(FloraKnowledgeDoc.builder()
            .docId("DOC-NUTRITION-EXERCISE-06")
            .title("Clinical Sports Nutrition & Menstrual Phase Training")
            .publisher("International Society of Sports Nutrition (ISSN)")
            .medicalReviewDate("2024-02-18")
            .category("LIFESTYLE")
            .citationUrl("https://jissn.biomedcentral.com")
            .keywords(List.of("food", "eat", "diet", "nutrition", "exercise", "workout", "gym", "protein", "iron", "khana", "kasrat"))
            .content("Nutritional requirements vary across cycle phases. During menstruation, focus on bioavailable iron (spinach, lentils, seeds) and vitamin C to replenish lost hemoglobin. Magnesium (pumpkin seeds, dark chocolate 70%+) helps reduce muscle spasms. During the follicular and ovulatory phases, higher insulin sensitivity and estrogen favor strength training and cardiovascular exercise. During the luteal phase, metabolic rate slightly increases; complex carbohydrates and adequate protein (1.0-1.2g/kg) sustain satiety.")
            .build());

        knowledgeBase.add(FloraKnowledgeDoc.builder()
            .docId("DOC-RED-FLAGS-07")
            .title("ACOG Committee Opinion: Critical Menstrual Red Flags & Triage")
            .publisher("ACOG & National Health Service (NHS)")
            .medicalReviewDate("2024-04-10")
            .category("EMERGENCY")
            .citationUrl("https://www.acog.org/womens-health/faqs/heavy-menstrual-bleeding")
            .keywords(List.of("heavy", "bleeding", "hemorrhage", "clot", "faint", "dizzy", "severe", "fever", "emergency", "bahut khoon"))
            .content("Red-flag clinical symptoms that require immediate medical attention: 1) Soaking through one or more pads or tampons every hour for 2 or more consecutive hours. 2) Passing blood clots larger than a quarter (approx. 2.5 cm). 3) Sudden, acute, unbearable pelvic pain that restricts movement. 4) Fever with pelvic tenderness or foul-smelling discharge. 5) Fainting, lightheadedness, or severe shortness of breath during menstruation. These signs can indicate hemorrhage, pelvic infection, or acute gynecological emergencies.")
            .build());
    }

    /**
     * Retrieves the top matching knowledge documents using keyword overlap and token score.
     */
    public List<FloraKnowledgeDoc> retrieveRelevantDocs(String query, int maxResults) {
        if (query == null || query.isBlank()) {
            return Collections.emptyList();
        }

        String lowerQuery = query.toLowerCase();
        Set<String> queryTokens = Arrays.stream(lowerQuery.split("\\W+"))
            .filter(t -> t.length() > 2)
            .collect(Collectors.toSet());

        List<ScoredDoc> scoredDocs = new ArrayList<>();

        for (FloraKnowledgeDoc doc : knowledgeBase) {
            double score = 0.0;

            // Keyword match weight
            for (String kw : doc.getKeywords()) {
                if (lowerQuery.contains(kw.toLowerCase())) {
                    score += 3.0;
                }
            }

            // Title match weight
            for (String token : queryTokens) {
                if (doc.getTitle().toLowerCase().contains(token)) {
                    score += 2.0;
                }
                if (doc.getContent().toLowerCase().contains(token)) {
                    score += 0.5;
                }
            }

            if (score > 0) {
                scoredDocs.add(new ScoredDoc(doc, score));
            }
        }

        scoredDocs.sort((a, b) -> Double.compare(b.score, a.score));

        return scoredDocs.stream()
            .limit(maxResults)
            .map(sd -> sd.doc)
            .collect(Collectors.toList());
    }

    private record ScoredDoc(FloraKnowledgeDoc doc, double score) {}
}
