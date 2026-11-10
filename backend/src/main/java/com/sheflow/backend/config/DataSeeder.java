package com.sheflow.backend.config;

import com.sheflow.backend.entity.*;
import com.sheflow.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PeriodLogRepository periodLogRepository;
    private final WaterRepository waterRepository;
    private final ProductRepository productRepository;
    private final WashroomRepository washroomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(
        UserRepository userRepository,
        PeriodLogRepository periodLogRepository,
        WaterRepository waterRepository,
        ProductRepository productRepository,
        WashroomRepository washroomRepository,
        ChatMessageRepository chatMessageRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.periodLogRepository = periodLogRepository;
        this.waterRepository = waterRepository;
        this.productRepository = productRepository;
        this.washroomRepository = washroomRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Demo user seeding intentionally removed.
        // New users go through the onboarding page to enter real cycle data.
        // Only product catalogue and washroom reference data is seeded below.
        if (false) { // disabled block — keep compiler happy, never executes
            User demoUser = User.builder()
                .fullName("Shreya Singh")
                .email("shreya@example.com")
                .password(passwordEncoder.encode("Sheflow@123"))
                .dateOfBirth(LocalDate.of(2001, 7, 15))
                .cycleLengthDays(28)
                .periodLengthDays(5)
                .lastPeriodStart(LocalDate.now().minusDays(14))
                .regularity("REGULAR")
                .onBirthControl(false)
                .waterGoalGlasses(8)
                .build();

            demoUser = userRepository.save(demoUser);

            // Seed initial Period Logs
            periodLogRepository.save(PeriodLog.builder()
                .user(demoUser)
                .startDate(LocalDate.now().minusDays(14))
                .endDate(LocalDate.now().minusDays(9))
                .flowIntensity("MEDIUM")
                .notes("Most recent period cycle")
                .build());

            periodLogRepository.save(PeriodLog.builder()
                .user(demoUser)
                .startDate(LocalDate.now().minusDays(42))
                .endDate(LocalDate.now().minusDays(37))
                .flowIntensity("MEDIUM")
                .notes("Previous cycle")
                .build());

            // Seed Today's Water Log (0 of 8 Glasses consumed initially)
            waterRepository.save(WaterLog.builder()
                .user(demoUser)
                .logDate(LocalDate.now())
                .glassesConsumed(0)
                .glassesGoal(8)
                .build());

            // Seed Initial Chat Messages with Flora
            chatMessageRepository.save(ChatMessage.builder()
                .user(demoUser)
                .sender("FLORA")
                .content("Hi Shreya! 🌸\nHow are you feeling today?")
                .timestamp("10:30 AM")
                .build());

            chatMessageRepository.save(ChatMessage.builder()
                .user(demoUser)
                .sender("USER")
                .content("I have mild cramps and feeling a bit tired.")
                .timestamp("10:31 AM")
                .build());

            chatMessageRepository.save(ChatMessage.builder()
                .user(demoUser)
                .sender("FLORA")
                .content("I'm sorry to hear that. Mild cramps and tiredness are common during the ovulation phase.\n\nMake sure you stay hydrated, eat balanced meals, and get enough rest. If the pain increases, let me know.")
                .timestamp("10:31 AM")
                .build());
        }

        // 2. Seed Hygiene Products with Price Comparison & E-Commerce Inventory
        if (productRepository.count() == 0) {
            productRepository.save(Product.builder()
                .name("Nua Ultra Thin Organic Cotton Pads")
                .brand("Nua")
                .category("PADS")
                .description("Chemical-free, zero perfume, personalized absorbency pack of 12.")
                .price(new java.math.BigDecimal("289.00"))
                .stock(500)
                .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80")
                .rating(5.0)
                .platformsJson("[{\"platformName\": \"Blinkit\", \"price\": 289, \"currency\": \"INR\", \"deliveryTime\": \"10 mins\", \"bestPrice\": true}, {\"platformName\": \"Amazon\", \"price\": 310, \"currency\": \"INR\", \"deliveryTime\": \"Tomorrow\"}, {\"platformName\": \"Nykaa\", \"price\": 320, \"currency\": \"INR\", \"deliveryTime\": \"2 days\"}]")
                .build());

            productRepository.save(Product.builder()
                .name("Sirona FDA Approved Menstrual Cup")
                .brand("Sirona")
                .category("MENSTRUAL_CUPS")
                .description("100% Medical Grade Silicone, up to 10 hours protection & leak-free.")
                .price(new java.math.BigDecimal("299.00"))
                .stock(250)
                .imageUrl("https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&q=80")
                .rating(4.9)
                .platformsJson("[{\"platformName\": \"Amazon\", \"price\": 299, \"currency\": \"INR\", \"deliveryTime\": \"Tomorrow\", \"bestPrice\": true}, {\"platformName\": \"Flipkart\", \"price\": 349, \"currency\": \"INR\", \"deliveryTime\": \"3 days\"}, {\"platformName\": \"Nykaa\", \"price\": 360, \"currency\": \"INR\", \"deliveryTime\": \"2 days\"}]")
                .build());

            productRepository.save(Product.builder()
                .name("Pee Safe Organic Tampons Regular")
                .brand("Pee Safe")
                .category("TAMPONS")
                .description("100% Organic cotton, biodegradable, applicator-free pack of 16.")
                .price(new java.math.BigDecimal("315.00"))
                .stock(300)
                .imageUrl("https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80")
                .rating(4.7)
                .platformsJson("[{\"platformName\": \"Blinkit\", \"price\": 315, \"currency\": \"INR\", \"deliveryTime\": \"12 mins\", \"bestPrice\": true}, {\"platformName\": \"Amazon\", \"price\": 330, \"currency\": \"INR\", \"deliveryTime\": \"Tomorrow\"}, {\"platformName\": \"Flipkart\", \"price\": 350, \"currency\": \"INR\", \"deliveryTime\": \"2 days\"}]")
                .build());

            productRepository.save(Product.builder()
                .name("Meftal-Spas Pain Relief Roll-On & Patches")
                .brand("Meftal-Spas")
                .category("PAIN_RELIEF")
                .description("Herbal cooling relief patches for period cramp management.")
                .price(new java.math.BigDecimal("219.00"))
                .stock(400)
                .imageUrl("https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&q=80")
                .rating(4.8)
                .platformsJson("[{\"platformName\": \"Apollo 24|7\", \"price\": 199, \"currency\": \"INR\", \"deliveryTime\": \"15 mins\", \"bestPrice\": true}, {\"platformName\": \"Blinkit\", \"price\": 219, \"currency\": \"INR\", \"deliveryTime\": \"10 mins\"}, {\"platformName\": \"Amazon\", \"price\": 240, \"currency\": \"INR\", \"deliveryTime\": \"Tomorrow\"}]")
                .build());

            productRepository.save(Product.builder()
                .name("Whisper Ultra Clean XL+ Wings Pads")
                .brand("Whisper")
                .category("PADS")
                .description("Feather-soft top sheet, rapid absorption with side wings. Pack of 30.")
                .price(new java.math.BigDecimal("350.00"))
                .stock(600)
                .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80")
                .rating(4.8)
                .platformsJson("[{\"platformName\": \"Blinkit\", \"price\": 350, \"currency\": \"INR\", \"deliveryTime\": \"10 mins\", \"bestPrice\": true}, {\"platformName\": \"Nykaa\", \"price\": 375, \"currency\": \"INR\", \"deliveryTime\": \"2 days\"}]")
                .build());

            productRepository.save(Product.builder()
                .name("Carmesi Sensitive 100% Rash-Free Sanitary Pads")
                .brand("Carmesi")
                .category("PADS")
                .description("Made with corn starch and bamboo, 100% rash-free guarantee. Pack of 30.")
                .price(new java.math.BigDecimal("425.00"))
                .stock(350)
                .imageUrl("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&q=80")
                .rating(4.9)
                .platformsJson("[{\"platformName\": \"Blinkit\", \"price\": 425, \"currency\": \"INR\", \"deliveryTime\": \"10 mins\", \"bestPrice\": true}, {\"platformName\": \"Nykaa\", \"price\": 450, \"currency\": \"INR\", \"deliveryTime\": \"2 days\"}]")
                .build());
        }

        // 3. Seed Washroom Facilities & Pad Dispensers
        if (washroomRepository.count() == 0) {
            washroomRepository.save(WashroomFacility.builder()
                .name("City Hospital Pad Dispenser & Restroom")
                .facilityType("VENDING_MACHINE")
                .address("Ground Floor, City Hospital, Wing B")
                .latitude(28.6139)
                .longitude(77.2090)
                .wheelchairAccessible(true)
                .openingHours("Open 24 Hours")
                .rating(4.9)
                .hasSanitaryPads(true)
                .build());

            washroomRepository.save(WashroomFacility.builder()
                .name("Central Metro Clean Restroom")
                .facilityType("PUBLIC_TOILET")
                .address("Gate 2, Concourse Level, Central Metro")
                .latitude(28.6145)
                .longitude(77.2100)
                .wheelchairAccessible(true)
                .openingHours("5:30 AM - 11:30 PM")
                .rating(4.6)
                .hasSanitaryPads(true)
                .build());

            washroomRepository.save(WashroomFacility.builder()
                .name("Bloom Organic Cafe Restroom")
                .facilityType("CAFE")
                .address("42 Orchid Lane, Market Complex")
                .latitude(28.6152)
                .longitude(77.2115)
                .wheelchairAccessible(false)
                .openingHours("8:00 AM - 11:00 PM")
                .rating(4.8)
                .hasSanitaryPads(false)
                .build());
        }
    }
}
