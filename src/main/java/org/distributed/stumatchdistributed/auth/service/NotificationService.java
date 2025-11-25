package org.distributed.stumatchdistributed.auth.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.Nullable;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class NotificationService {
    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final Optional<JavaMailSender> mailSender;

    public NotificationService(@Nullable JavaMailSender mailSender) {
        this.mailSender = Optional.ofNullable(mailSender);
    }

    public void sendOtpEmail(String to, String code, String purpose) {
        String subject = "Your verification code";
        String body = """
                Greetings,

                Your one-time code (%s) for %s is:

                %s

                This code expires in 5 minutes.

                -- Distributed Cloud Team
                """.formatted(purpose, to, code);

        if (mailSender.isEmpty()) {
            log.warn("No mail sender configured. OTP for {} is {}", to, code);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.get().send(message);
        } catch (MailException e) {
            log.error("Failed to send OTP email to {}", to, e);
            // fallback log and continue
        }
    }
}

