public with sharing class MatchingRuleController {
    
    private static final MatchingRuleService service = new MatchingRuleService();
    private static final MetadataRepository metadataRepo = new MetadataRepository();

    @AuraEnabled
    public static Id saveFullRule(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
        try {
            return service.saveFullRule(rule, items);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static MatchingRuleWrapper getFullRule(Id ruleId) {
        try {
            return service.getFullRule(ruleId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void deleteRule(Id ruleId) {
        try {
            service.deleteFullRule(ruleId);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<ADM_MatchingRule__c> listRules() {
        try {
            return service.listRules();
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void toggleActive(Id ruleId, Boolean isActive) {
        try {
            service.toggleActive(ruleId, isActive);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getAvailableObjects() {
         try {
        return metadataRepo.getAllObjects();
    } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
    }
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Map<String, String>> getObjectFields(String objectName) {
        try {
        return metadataRepo.getObjectFields(objectName);
        } catch (Exception e) {
        throw new AuraHandledException(e.getMessage());
        }
    }
    
    // ========== Méthodes privées ==========
    
    private static Boolean isSupportedObject(String objectName) {
        // Exclure les objets système trop techniques
        if (objectName.startsWith('__')) return false;
        if (objectName.endsWith('__Tag') || objectName.endsWith('__History')) return false;
        if (objectName.endsWith('__Share')) return false;
        
        // Inclure les objets standards courants
        Set<String> standardObjects = new Set<String>{
            'Contact', 'Lead', 'Account', 'Opportunity', 'Case'
        };
        
        return standardObjects.contains(objectName) || objectName.endsWith('__c');
    }
    
    private static Boolean isSupportedFieldType(Schema.DescribeFieldResult fieldDescribe) {
        // Types de champs supportés pour le matching
        Set<Schema.DisplayType> supportedTypes = new Set<Schema.DisplayType>{
            Schema.DisplayType.String,
            Schema.DisplayType.Email,
            Schema.DisplayType.Phone,
            Schema.DisplayType.TextArea,
            Schema.DisplayType.URL
        };
        
        return supportedTypes.contains(fieldDescribe.getType());
    }
}