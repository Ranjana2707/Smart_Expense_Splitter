package com.splitwise.service;

import com.splitwise.dto.BalanceDTO;
import com.splitwise.dto.SettlementDTO;
import com.splitwise.dto.UserDTO;
import com.splitwise.entity.Expense;
import com.splitwise.entity.ExpenseSplit;
import com.splitwise.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SettlementService {

    private final ExpenseService expenseService;
    private final GroupService groupService;

    /**
     * Calculate net balance per user in a group.
     * Positive = user is owed money (creditor).
     * Negative = user owes money (debtor).
     */
    public List<BalanceDTO> calculateBalances(Long groupId) {
        List<Expense> expenses = expenseService.getExpensesByGroup(groupId);
        Map<Long, BigDecimal> balanceMap = new HashMap<>();
        Map<Long, String> nameMap = new HashMap<>();

        // Populate all group members with zero balance
        var group = groupService.getGroupEntity(groupId);
        for (User member : group.getMembers()) {
            balanceMap.put(member.getId(), BigDecimal.ZERO);
            nameMap.put(member.getId(), member.getName());
        }

        for (Expense expense : expenses) {
            Long payerId = expense.getPaidBy().getId();
            // Payer gets credited the full amount
            balanceMap.merge(payerId, expense.getAmount(), BigDecimal::add);

            // Each split user gets debited their share
            for (ExpenseSplit split : expense.getSplits()) {
                Long userId = split.getUser().getId();
                balanceMap.merge(userId, split.getAmount().negate(), BigDecimal::add);
            }
        }

        return balanceMap.entrySet().stream()
                .map(e -> new BalanceDTO(e.getKey(), nameMap.get(e.getKey()), e.getValue()))
                .collect(Collectors.toList());
    }

    /**
     * Greedy settlement optimization:
     * 1. Calculate net balances
     * 2. Separate into creditors (positive) and debtors (negative)
     * 3. Match highest creditor with highest debtor
     * 4. Minimize number of transactions
     */
    public List<SettlementDTO> calculateSettlements(Long groupId) {
        List<BalanceDTO> balances = calculateBalances(groupId);
        var group = groupService.getGroupEntity(groupId);

        // Build user lookup
        Map<Long, User> userMap = new HashMap<>();
        for (User m : group.getMembers()) {
            userMap.put(m.getId(), m);
        }

        // Separate creditors and debtors
        // creditor: balance > 0 (is owed money)
        // debtor: balance < 0 (owes money)
        PriorityQueue<long[]> creditors = new PriorityQueue<>((a, b) -> Long.compare(b[1], a[1]));
        PriorityQueue<long[]> debtors = new PriorityQueue<>((a, b) -> Long.compare(b[1], a[1]));

        for (BalanceDTO b : balances) {
            long cents = b.getBalance().multiply(BigDecimal.valueOf(100)).longValue();
            if (cents > 0) {
                creditors.add(new long[]{b.getUserId(), cents});
            } else if (cents < 0) {
                debtors.add(new long[]{b.getUserId(), -cents}); // store as positive
            }
        }

        List<SettlementDTO> settlements = new ArrayList<>();

        while (!creditors.isEmpty() && !debtors.isEmpty()) {
            long[] creditor = creditors.poll();
            long[] debtor = debtors.poll();

            long settleAmount = Math.min(creditor[1], debtor[1]);

            User fromUser = userMap.get(debtor[0]);
            User toUser = userMap.get(creditor[0]);

            BigDecimal amount = BigDecimal.valueOf(settleAmount).divide(BigDecimal.valueOf(100), 2, BigDecimal.ROUND_HALF_UP);

            settlements.add(new SettlementDTO(
                    AuthService.toDTO(fromUser),
                    AuthService.toDTO(toUser),
                    amount
            ));

            long creditorRemaining = creditor[1] - settleAmount;
            long debtorRemaining = debtor[1] - settleAmount;

            if (creditorRemaining > 0) {
                creditors.add(new long[]{creditor[0], creditorRemaining});
            }
            if (debtorRemaining > 0) {
                debtors.add(new long[]{debtor[0], debtorRemaining});
            }
        }

        return settlements;
    }
}
