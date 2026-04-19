public with sharing class MatchingRuleRepository {

    // ═══════════════════════════════════════════════════
    //  CRUD ADM_MatchingRule__c
    // ═══════════════════════════════════════════════════

    public ADM_MatchingRule__c getRule(Id ruleId) {
        if (ruleId == null) return null;

        List<ADM_MatchingRule__c> rows = [
            SELECT Id,
                   DeveloperName__c,
                   MasterLabel__c,
                   Description__c,
                   SobjectType__c,
                   NamespacePrefix__c,
                   IsActive__c,
                   BooleanFilter__c
            FROM   ADM_MatchingRule__c
            WHERE  Id = :ruleId
            LIMIT  1
        ];
        return rows.isEmpty() ? null : rows[0];
    }

    public List<ADM_MatchingRule__c> getAllRules() {
        return [
            SELECT Id,
                   DeveloperName__c,
                   MasterLabel__c,
                   Description__c,
                   SobjectType__c,
                   NamespacePrefix__c,
                   IsActive__c,
                   BooleanFilter__c
            FROM   ADM_MatchingRule__c
            ORDER BY CreatedDate DESC
        ];
    }

    public void saveRule(ADM_MatchingRule__c rule) {
        if (rule == null) {
            throw new IllegalArgumentException('La règle ne peut pas être null');
        }
        if (rule.Id == null) {
            insert rule;
        } else {
            update rule;
        }
    }

    public void deleteRule(Id ruleId) {
        if (ruleId == null) {
            throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
        }
        delete new ADM_MatchingRule__c(Id = ruleId);
    }

    public void toggleActive(Id ruleId, Boolean isActive) {
        if (ruleId == null) throw new IllegalArgumentException('L\'Id ne peut pas être null');
        if (isActive == null) throw new IllegalArgumentException('isActive ne peut pas être null');
        update new ADM_MatchingRule__c(Id = ruleId, IsActive__c = isActive);
    }

    // ═══════════════════════════════════════════════════
    //  CRUD ADM_MatchingRuleItem__c
    // ═══════════════════════════════════════════════════

    public List<ADM_MatchingRuleItem__c> getItemsByRuleId(Id ruleId) {
        if (ruleId == null) return new List<ADM_MatchingRuleItem__c>();

        return [
            SELECT Id,
                   MatchingRule__c,
                   Field__c,
                   MatchingMethod__c,
                   SortOrder__c,
                   Weight__c,
                   MatchBlankFields__c
            FROM   ADM_MatchingRuleItem__c
            WHERE  MatchingRule__c = :ruleId
            ORDER BY SortOrder__c ASC
        ];
    }

    public void deleteItemsByRuleId(Id ruleId) {
        if (ruleId == null) return;
        List<ADM_MatchingRuleItem__c> existing = getItemsByRuleId(ruleId);
        if (!existing.isEmpty()) delete existing;
    }

    /**
     * Supprime tous les anciens items et insère les nouveaux.
     * Stratégie "replace all" : simple, sans gestion de diff.
     */
    public void saveItems(Id ruleId, List<ADM_MatchingRuleItem__c> items) {
        if (ruleId == null) throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
        if (items == null)  items = new List<ADM_MatchingRuleItem__c>();

        // 1. Supprimer les anciens items
        deleteItemsByRuleId(ruleId);

        // 2. Insérer les nouveaux items en forçant la relation parent
        if (!items.isEmpty()) {
            for (ADM_MatchingRuleItem__c item : items) {
                item.MatchingRule__c = ruleId;
                // Nettoyer un éventuel Id venant du frontend (items nouveaux n'en ont pas)
                item.Id = null;
            }
            insert items;
        }
    }

    // ═══════════════════════════════════════════════════
    //  Opération atomique règle + items
    // ═══════════════════════════════════════════════════

    public Id saveFullRule(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
        if (rule == null) throw new IllegalArgumentException('La règle ne peut pas être null');
        if (items == null) items = new List<ADM_MatchingRuleItem__c>();

        Savepoint sp = Database.setSavepoint();
        try {
            saveRule(rule);
            saveItems(rule.Id, items);
            return rule.Id;
        } catch (Exception e) {
            Database.rollback(sp);
            throw new IllegalArgumentException('Erreur lors de la sauvegarde : ' + e.getMessage());
        }
    }

    // ═══════════════════════════════════════════════════
    //  Contrôle unicité DeveloperName
    // ═══════════════════════════════════════════════════

    public Boolean isDeveloperNameUnique(String developerName, Id excludeRuleId) {
        if (String.isBlank(developerName)) return false;

        List<ADM_MatchingRule__c> existing = [
            SELECT Id
            FROM   ADM_MatchingRule__c
            WHERE  DeveloperName__c = :developerName
            AND    Id != :excludeRuleId
            LIMIT  1
        ];
        return existing.isEmpty();
    }
}