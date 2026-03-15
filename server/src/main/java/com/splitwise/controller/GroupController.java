package com.splitwise.controller;

import com.splitwise.dto.BalanceDTO;
import com.splitwise.dto.CreateGroupRequest;
import com.splitwise.dto.GroupDTO;
import com.splitwise.dto.SettlementDTO;
import com.splitwise.entity.Expense;
import com.splitwise.entity.User;
import com.splitwise.service.ExpenseService;
import com.splitwise.service.GroupService;
import com.splitwise.service.SettlementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;
    private final ExpenseService expenseService;
    private final SettlementService settlementService;

    @PostMapping
    public ResponseEntity<GroupDTO> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(groupService.createGroup(request, currentUser));
    }

    @GetMapping
    public ResponseEntity<List<GroupDTO>> getGroups(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(groupService.getUserGroups(currentUser));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GroupDTO> getGroup(@PathVariable Long id) {
        return ResponseEntity.ok(groupService.getGroupById(id));
    }

    @GetMapping("/{id}/expenses")
    public ResponseEntity<List<Expense>> getExpenses(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.getExpensesByGroup(id));
    }

    @GetMapping("/{id}/balances")
    public ResponseEntity<List<BalanceDTO>> getBalances(@PathVariable Long id) {
        return ResponseEntity.ok(settlementService.calculateBalances(id));
    }

    @GetMapping("/{id}/settlements")
    public ResponseEntity<List<SettlementDTO>> getSettlements(@PathVariable Long id) {
        return ResponseEntity.ok(settlementService.calculateSettlements(id));
    }
}
