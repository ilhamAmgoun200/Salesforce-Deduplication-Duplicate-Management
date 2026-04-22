public with sharing class MatchingRuleController {

    private static final MatchingRuleService service      = new MatchingRuleService();
    private static final MetadataRepository  metadataRepo = new MetadataRepository();

    /**
     * Retourne toutes les règles AVEC leurs items pour la liste principale.
     * Utilise MatchingRuleWrapper défini dans MatchingRuleService.
     */
    @AuraEnabled(cacheable=true)
    public static List<MatchingRuleWrapper> listRules() {
        try {
            List<ADM_MatchingRule__c> rules = service.listRules();

            if (rules.isEmpty()) return new List<MatchingRuleWrapper>();

            Set<Id> ruleIds = new Map<Id, ADM_MatchingRule__c>(rules).keySet();

            List<ADM_MatchingRuleItem__c> allItems = [
                SELECT Id, Name, MatchingRule__c, Field__c,
                       MatchingMethod__c, Weight__c, SortOrder__c,
                       MatchBlankFields__c
                FROM ADM_MatchingRuleItem__c
                WHERE MatchingRule__c IN :ruleIds
                ORDER BY SortOrder__c ASC
            ];

            Map<Id, List<ADM_MatchingRuleItem__c>> itemsByRule =
                new Map<Id, List<ADM_MatchingRuleItem__c>>();

            for (ADM_MatchingRuleItem__c item : allItems) {
                Id rId = item.MatchingRule__c;
                if (!itemsByRule.containsKey(rId)) {
                    itemsByRule.put(rId, new List<ADM_MatchingRuleItem__c>());
                }
                itemsByRule.get(rId).add(item);
            }

            // ✅ Récupérer la Map des labels depuis MetadataRepository
             MetadataRepository metadataRepo = new MetadataRepository();
             Map<String, String> objectLabels = metadataRepo.getObjectLabelsMap();

            List<MatchingRuleWrapper> wrappers = new List<MatchingRuleWrapper>();
            for (ADM_MatchingRule__c r : rules) {
                List<ADM_MatchingRuleItem__c> its = itemsByRule.containsKey(r.Id)
                    ? itemsByRule.get(r.Id)
                    : new List<ADM_MatchingRuleItem__c>();
                //wrappers.add(new MatchingRuleWrapper(r, its));

                MatchingRuleWrapper wrapper = new MatchingRuleWrapper(r, its);
            
            String apiName = r.SobjectType__c;
            String label = objectLabels.get(apiName.toLowerCase());
            wrapper.objectLabel = (label != null) ? label : apiName;
            
            wrappers.add(wrapper);
            }

            return wrappers;

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Retourne la règle complète (règle + ses items) pour la modale d'édition.
     */
    @AuraEnabled(cacheable=true)
    public static MatchingRuleWrapper getFullRule(Id ruleId) {
        try {
            return service.getFullRule(ruleId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // Sauvegarde (création ou mise à jour) une règle et ses items.
     
   @AuraEnabled
public static Id saveFullRule(ADM_MatchingRule__c rule,
                              List<ADM_MatchingRuleItem__c> items) {
    try {
        // 🔥 Nettoyer les items : supprimer les Id pour forcer l'insert
        if (items != null) {
            for (ADM_MatchingRuleItem__c item : items) {
                item.Id = null;  // ← Force la création de nouveaux enregistrements
                // MatchingRule__c sera défini dans le repository
            }
        }
        return service.saveFullRule(rule, items);
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
}

    /**
     * Supprime une règle et tous ses items associés.
     */
    @AuraEnabled
    public static void deleteRule(Id ruleId) {
        try {
            service.deleteFullRule(ruleId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Active ou désactive une règle.
     */
    @AuraEnabled
    public static void toggleActive(Id ruleId, Boolean isActive) {
        try {
            service.toggleActive(ruleId, isActive);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Retourne tous les objets Salesforce accessibles dans l'org.
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAvailableObjects() {
        try {
            return metadataRepo.getAllObjects();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    /**
     * Retourne les champs d'un objet donné.
     */
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getObjectFields(String objectName) {
        try {
            return metadataRepo.getObjectFields(objectName);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}