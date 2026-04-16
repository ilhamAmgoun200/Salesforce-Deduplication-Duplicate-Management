public with sharing class MatchingRuleRepository {
    
    // ========== CRUD Rule ==========
    public ADM_MatchingRule__c getRule(Id ruleId) {
       if (ruleId == null) {
        return null;
    }
    
    List<ADM_MatchingRule__c> rules = [
        SELECT Id, DeveloperName__c, MasterLabel__c, Description__c,
               SobjectType__c, NamespacePrefix__c, IsActive__c
        FROM ADM_MatchingRule__c
        WHERE Id = :ruleId
        LIMIT 1
    ];
    
    return rules.isEmpty() ? null : rules[0];
    }
    
    public List<ADM_MatchingRule__c> getAllRules() {
        return [
        SELECT Id, DeveloperName__c, MasterLabel__c, Description__c,
               SobjectType__c, NamespacePrefix__c, IsActive__c
        FROM ADM_MatchingRule__c
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
    
    ADM_MatchingRule__c rule = new ADM_MatchingRule__c(Id = ruleId);
    delete rule;
    }
    
    public void toggleActive(Id ruleId, Boolean isActive) {
        if (ruleId == null) {
        throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
    }
    
    if (isActive == null) {
        throw new IllegalArgumentException('Le champ isActive ne peut pas être null');
    }
    
    ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
        Id = ruleId,
        IsActive__c = isActive
    );
    
    update rule;
    }
    
    // ========== Items ==========
    public List<ADM_MatchingRuleItem__c> getItemsByRuleId(Id ruleId) {
         if (ruleId == null) {
        return new List<ADM_MatchingRuleItem__c>();
    }
    
    return [
        SELECT Id, MatchingRule__c, Field__c, MatchingMethod__c, SortOrder__c, Weight__c
        FROM ADM_MatchingRuleItem__c
        WHERE MatchingRule__c = :ruleId
        ORDER BY SortOrder__c ASC
    ];
    }
    
    public void deleteItemsByRuleId(Id ruleId) {
        if (ruleId == null) {
        return;
    }
    
    List<ADM_MatchingRuleItem__c> items = getItemsByRuleId(ruleId);
    
    if (!items.isEmpty()) {
        delete items;
    }
    }
    
    public void saveItems(Id ruleId, List<ADM_MatchingRuleItem__c> items) {
       if (ruleId == null) {
        throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
    }
    
    if (items == null) {
        items = new List<ADM_MatchingRuleItem__c>();
    }
    
    // 1. Supprimer les anciens items
    deleteItemsByRuleId(ruleId);
    
    // 2. Insérer les nouveaux items
    if (!items.isEmpty()) {
        // Vérifier que chaque item est bien lié à la bonne règle
        for (ADM_MatchingRuleItem__c item : items) {
            item.MatchingRule__c = ruleId;
        }
        insert items;
    }
    }
    
    // ========== Opération atomique ==========
    public Id saveFullRule(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
        if (rule == null) {
        throw new IllegalArgumentException('La règle ne peut pas être null');
    }
    
    if (items == null) {
        items = new List<ADM_MatchingRuleItem__c>();
    }
    
    // Créer un point de sauvegarde
    Savepoint sp = Database.setSavepoint();
    
    try {
        // 1. Sauvegarder la règle
        saveRule(rule);
        
        // 2. Sauvegarder les items
        saveItems(rule.Id, items);
        
        return rule.Id;
        
    } catch (Exception e) {
        // En cas d'erreur, annuler toutes les modifications
        Database.rollback(sp);
        throw new IllegalArgumentException('Erreur lors de la sauvegarde de la règle: ' + e.getMessage());
    }
    }

    //2 rules must not have same developer name
    public Boolean isDeveloperNameUnique(String developerName, Id excludeRuleId) {
    if (String.isBlank(developerName)) {
        return false;
    }
    
    List<ADM_MatchingRule__c> existingRules = [
        SELECT Id 
        FROM ADM_MatchingRule__c 
        WHERE DeveloperName__c = :developerName
        AND Id != :excludeRuleId
        LIMIT 1
    ];
    
    return existingRules.isEmpty();
}
}