package org.distributed.stumatchdistributed.auth.dto;

public record AuthResponse(
        boolean success,
        String message
) {}

