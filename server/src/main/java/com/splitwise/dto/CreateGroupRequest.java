package com.splitwise.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateGroupRequest {
    @NotBlank
    private String name;

    private String description;

    private List<String> memberEmails;
}
