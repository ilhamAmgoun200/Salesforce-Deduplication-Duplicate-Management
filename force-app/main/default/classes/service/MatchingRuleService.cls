public with sharing class MatchingRuleService {
    
    private final MatchingRuleRepository repo;
    private final MetadataRepository metadataRepo;


    // Constructeur
    public MatchingRuleService() {
        this.repo = new MatchingRuleRepository();
        this.metadataRepo = new MetadataRepository();

    }
    
    // Constructeur pour injection de dépendance (tests)
    public MatchingRuleService(MatchingRuleRepository repo, MetadataRepository metadataRepo) {
        this.repo = repo;
        this.metadataRepo = metadataRepo;
    }
    
    // ========== Méthodes publiques ==========
    
    public MatchingRuleWrapper getFullRule(Id ruleId) {
    if (ruleId == null) {
        throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
    }
    
    ADM_MatchingRule__c rule = repo.getRule(ruleId);
    
    if (rule == null) {
        throw new IllegalArgumentException('Aucune règle trouvée avec l\'Id: ' + ruleId);
    }
    
    List<ADM_MatchingRuleItem__c> items = repo.getItemsByRuleId(ruleId);
    
    return new MatchingRuleWrapper(rule, items);
}
    
    public Id saveFullRule(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
         // 1. Valider les données
    validateRule(rule);
    validateItems(items);
    
    // 2. Sauvegarder via repository (transaction atomique)
    return repo.saveFullRule(rule, items);
    }
    
   public void deleteFullRule(Id ruleId) {
    if (ruleId == null) {
        throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
    }
    
    // Vérifier que la règle existe
    ADM_MatchingRule__c rule = repo.getRule(ruleId);
    if (rule == null) {
        throw new IllegalArgumentException('Aucune règle trouvée avec l\'Id: ' + ruleId);
    }
    
    // 1. Supprimer les items
    repo.deleteItemsByRuleId(ruleId);
    
    // 2. Supprimer la règle
    repo.deleteRule(ruleId);
}
    
   public List<ADM_MatchingRule__c> listRules() {
        return repo.getAllRules();
    }
    
    public void toggleActive(Id ruleId, Boolean isActive) {
        if (ruleId == null) {
            throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
        }
        
        if (isActive == null) {
            throw new IllegalArgumentException('Le champ isActive ne peut pas être null');
        }
        
        repo.toggleActive(ruleId, isActive);
    }
    
    // ========== Méthodes privées (validations) ==========
    
    private void validateRule(ADM_MatchingRule__c rule) {
        if (rule == null) {
        throw new IllegalArgumentException('La règle ne peut pas être null');
    }
    
    if (String.isBlank(rule.DeveloperName__c)) {
        throw new IllegalArgumentException('Le nom technique DeveloperName est requis');
    }
    
    if (String.isBlank(rule.SobjectType__c)) {
        throw new IllegalArgumentException('L\'objet cible  est requis');
    }
    
    // Vérifier que l'objet existe dans l'org
    if (!metadataRepo.objectExists(rule.SobjectType__c)) {
        throw new IllegalArgumentException('L\'objet "' + rule.SobjectType__c + '" n\'existe pas dans l\'organisation');
    }

    // Vérifier que le DeveloperName__c est unique
    if (!repo.isDeveloperNameUnique(rule.DeveloperName__c, rule.Id)) {
        throw new IllegalArgumentException('Une règle avec le nom technique "' + rule.DeveloperName__c + '" existe déjà');
    }
    }
    
    private void validateItems(List<ADM_MatchingRuleItem__c> items) {
    if (items == null || items.isEmpty()) {
        throw new IllegalArgumentException('Une règle doit avoir au moins un item');
    }
    
    for (ADM_MatchingRuleItem__c item : items) {
        // Vérifier que le champ est renseigné
        if (String.isBlank(item.Field__c)) {
            throw new IllegalArgumentException('Le champ Field est requis pour chaque item');
        }
        
        // Vérifier que la méthode de matching est renseignée
        if (String.isBlank(item.MatchingMethod__c)) {
            throw new IllegalArgumentException('La méthode de matching est requise pour chaque item');
        }
        
        // Vérifier que le poids est valide (0-100)
        if (item.Weight__c == null || item.Weight__c < 0 || item.Weight__c > 100) {
            throw new IllegalArgumentException('Le poids doit être compris entre 0 et 100 pour chaque item');
        }
        
        // Vérifier que l'ordre est renseigné
        if (item.SortOrder__c == null) {
            throw new IllegalArgumentException('L\'ordre est requis pour chaque item');
        }
    }
}
}

