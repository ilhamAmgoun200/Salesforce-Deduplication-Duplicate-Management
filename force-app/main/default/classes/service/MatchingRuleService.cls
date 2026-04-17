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
    validateItems(items);
    validateRule(rule, items);
    
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
    
    private void validateRule(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
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

     // Valider le format du BooleanFilter__c
    if (!String.isBlank(rule.BooleanFilter__c)) {
       validateBooleanFilter(rule.BooleanFilter__c, items);
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

private void validateBooleanFilter(String filter, List<ADM_MatchingRuleItem__c> items) {
    // 1. Extraire tous les numéros présents dans la formule
    Set<Integer> referencedOrders = new Set<Integer>();
    Matcher matcher = Pattern.compile('\\d+').matcher(filter);
    while (matcher.find()) {
        referencedOrders.add(Integer.valueOf(matcher.group()));
    }
    
    // 2. Récupérer les SortOrder des items existants
    Set<Integer> existingOrders = new Set<Integer>();
    for (ADM_MatchingRuleItem__c item : items) {
        if (item.SortOrder__c != null) {
            existingOrders.add((Integer)item.SortOrder__c);
        }
    }
    
    // 3. Vérifier que chaque numéro référencé existe dans les items
    for (Integer order : referencedOrders) {
        if (!existingOrders.contains(order)) {
            throw new IllegalArgumentException(
                'Le filtre booléen référence l\'item ' + order + 
                ' mais cet item n\'existe pas dans la règle'
            );
        }
    }
}

}

