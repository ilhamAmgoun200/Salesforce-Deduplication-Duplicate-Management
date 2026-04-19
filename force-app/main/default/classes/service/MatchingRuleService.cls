public with sharing class MatchingRuleService {

    private final MatchingRuleRepository repo;
    private final MetadataRepository     metadataRepo;

    // ── Constructeurs ─────────────────────────────────────────────────────────

    public MatchingRuleService() {
        this.repo        = new MatchingRuleRepository();
        this.metadataRepo = new MetadataRepository();
    }

    /** Constructeur pour injection de dépendances (tests unitaires) */
    public MatchingRuleService(MatchingRuleRepository repo, MetadataRepository metadataRepo) {
        this.repo        = repo;
        this.metadataRepo = metadataRepo;
    }

    // ── API publique ──────────────────────────────────────────────────────────

    public MatchingRuleWrapper getFullRule(Id ruleId) {
        if (ruleId == null) {
            throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
        }

        ADM_MatchingRule__c rule = repo.getRule(ruleId);
        if (rule == null) {
            throw new IllegalArgumentException('Aucune règle trouvée pour l\'Id : ' + ruleId);
        }

        List<ADM_MatchingRuleItem__c> items = repo.getItemsByRuleId(ruleId);
        return new MatchingRuleWrapper(rule, items);
    }

    public Id saveFullRule(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
        // Les validations sont dans l'ordre :
        // items d'abord car validateRule utilise les SortOrder des items (BooleanFilter)
        validateItems(items);
        validateRule(rule, items);
        return repo.saveFullRule(rule, items);
    }

    public void deleteFullRule(Id ruleId) {
        if (ruleId == null) {
            throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
        }

        ADM_MatchingRule__c rule = repo.getRule(ruleId);
        if (rule == null) {
            throw new IllegalArgumentException('Aucune règle trouvée pour l\'Id : ' + ruleId);
        }

        // Les items sont en Master-Detail → supprimés en cascade.
        // On appelle explicitement deleteItems pour être sûr (ordre garanti).
        repo.deleteItemsByRuleId(ruleId);
        repo.deleteRule(ruleId);
    }

    public List<ADM_MatchingRule__c> listRules() {
        return repo.getAllRules();
    }

    public void toggleActive(Id ruleId, Boolean isActive) {
        if (ruleId  == null) throw new IllegalArgumentException('L\'Id de la règle ne peut pas être null');
        if (isActive == null) throw new IllegalArgumentException('isActive ne peut pas être null');
        repo.toggleActive(ruleId, isActive);
    }

    // ── Validations privées ───────────────────────────────────────────────────

    private void validateRule(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
        if (rule == null) {
            throw new IllegalArgumentException('La règle ne peut pas être null');
        }

        if (String.isBlank(rule.DeveloperName__c)) {
            throw new IllegalArgumentException('Le nom technique (DeveloperName) est requis');
        }

        // Format : commence par une lettre, contient lettres/chiffres/underscores uniquement
        if (!Pattern.matches('^[a-zA-Z][a-zA-Z0-9_]*$', rule.DeveloperName__c)) {
            throw new IllegalArgumentException(
                'Le DeveloperName ne doit contenir que des lettres, chiffres et underscores, et commencer par une lettre'
            );
        }

        if (String.isBlank(rule.SobjectType__c)) {
            throw new IllegalArgumentException('L\'objet Salesforce cible est requis');
        }

        // Vérifier que l'objet existe vraiment dans cette org
        if (!metadataRepo.objectExists(rule.SobjectType__c)) {
            throw new IllegalArgumentException(
                'L\'objet "' + rule.SobjectType__c + '" n\'existe pas dans cette organisation'
            );
        }

        // Vérifier l'unicité du DeveloperName (en excluant la règle elle-même si update)
        if (!repo.isDeveloperNameUnique(rule.DeveloperName__c, rule.Id)) {
            throw new IllegalArgumentException(
                'Une règle avec le nom technique "' + rule.DeveloperName__c + '" existe déjà'
            );
        }

        // Valider le BooleanFilter si renseigné
        if (!String.isBlank(rule.BooleanFilter__c)) {
            validateBooleanFilter(rule.BooleanFilter__c, items);
        }
    }

    private void validateItems(List<ADM_MatchingRuleItem__c> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException('Une règle doit contenir au moins un critère de matching');
        }

        Set<String> validMethods = new Set<String>{ 'Exact', 'Fuzzy', 'Phonetic' };
        Set<Integer> seenOrders  = new Set<Integer>();

        for (ADM_MatchingRuleItem__c item : items) {

            if (String.isBlank(item.Field__c)) {
                throw new IllegalArgumentException('Le champ (Field) est requis pour chaque critère');
            }

            if (String.isBlank(item.MatchingMethod__c)) {
                throw new IllegalArgumentException('La méthode de matching est requise pour chaque critère');
            }

            if (!validMethods.contains(item.MatchingMethod__c)) {
                throw new IllegalArgumentException(
                    'Méthode invalide "' + item.MatchingMethod__c + '". Valeurs acceptées : Exact, Fuzzy, Phonetic'
                );
            }

            if (item.Weight__c == null || item.Weight__c < 0 || item.Weight__c > 100) {
                throw new IllegalArgumentException(
                    'Le poids doit être compris entre 0 et 100 pour chaque critère'
                );
            }

            if (item.SortOrder__c == null) {
                throw new IllegalArgumentException('L\'ordre (SortOrder) est requis pour chaque critère');
            }

            Integer order = (Integer) item.SortOrder__c;
            if (seenOrders.contains(order)) {
                throw new IllegalArgumentException(
                    'Deux critères ne peuvent pas avoir le même numéro d\'ordre : ' + order
                );
            }
            seenOrders.add(order);
        }
    }

    private void validateBooleanFilter(String filter, List<ADM_MatchingRuleItem__c> items) {
        // Extraire tous les numéros référencés dans la formule
        Set<Integer> referenced = new Set<Integer>();
        Matcher m = Pattern.compile('\\d+').matcher(filter);
        while (m.find()) {
            referenced.add(Integer.valueOf(m.group()));
        }

        // Récupérer les numéros d'ordre des items
        Set<Integer> existing = new Set<Integer>();
        for (ADM_MatchingRuleItem__c item : items) {
            if (item.SortOrder__c != null) {
                existing.add((Integer) item.SortOrder__c);
            }
        }

        // Vérifier que chaque numéro référencé correspond bien à un item
        for (Integer num : referenced) {
            if (!existing.contains(num)) {
                throw new IllegalArgumentException(
                    'Le filtre booléen référence le critère n°' + num + ' qui n\'existe pas dans cette règle'
                );
            }
        }

        // Vérification syntaxique : que des chiffres, AND, OR, NOT, parenthèses, espaces
        String sanitized = filter.toUpperCase();
        if (!Pattern.matches('[0-9ANDORNOTandornot()\\s]+', sanitized)) {
            throw new IllegalArgumentException(
                'Le filtre booléen ne doit contenir que des numéros, AND, OR, NOT et des parenthèses'
            );
        }
    }
}