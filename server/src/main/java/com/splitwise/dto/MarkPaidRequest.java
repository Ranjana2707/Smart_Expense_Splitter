package com.splitwise.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MarkPaidRequest {
    @NotNull
    private Long fromUserId;

    @NotNull
    private Long toUserId;

    @NotNull @Positive
    private BigDecimal amount;

    @NotNull
    private Long groupId;
}
