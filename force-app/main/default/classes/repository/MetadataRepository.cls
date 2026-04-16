public with sharing class MetadataRepository {
    
    public Boolean objectExists(String objectName) {
        if (String.isBlank(objectName)) {
            return false;
        }
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        return globalDescribe.containsKey(objectName);
    }
    
    public List<Map<String, String>> getAllObjects() {
        List<Map<String, String>> objects = new List<Map<String, String>>();
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        
        for (String objectName : globalDescribe.keySet()) {
            if (isSupportedObject(objectName)) {
                Map<String, String> objMap = new Map<String, String>();
                objMap.put('label', objectName);
                objMap.put('value', objectName);
                objects.add(objMap);
            }
        }
        objects.sort();
        return objects;
    }
    
    public List<Map<String, String>> getObjectFields(String objectName) {
        List<Map<String, String>> fields = new List<Map<String, String>>();
        
        if (String.isBlank(objectName)) {
            return fields;
        }
        
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe();
        if (!globalDescribe.containsKey(objectName)) {
            return fields;
        }
        
        Map<String, Schema.SObjectField> fieldMap = globalDescribe.get(objectName).getDescribe().fields.getMap();
        
        for (String fieldName : fieldMap.keySet()) {
            Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
            if (isSupportedFieldType(fieldDescribe)) {
                Map<String, String> fieldMap2 = new Map<String, String>();
                fieldMap2.put('label', fieldDescribe.getLabel());
                fieldMap2.put('value', fieldName);
                fields.add(fieldMap2);
            }
        }
        
        fields.sort();
        return fields;
    }
    
    private Boolean isSupportedObject(String objectName) {
        if (objectName.startsWith('__')) return false;
        if (objectName.endsWith('__Tag') || objectName.endsWith('__History')) return false;
        if (objectName.endsWith('__Share')) return false;
        
        Set<String> standardObjects = new Set<String>{
            'Contact', 'Lead', 'Account', 'Opportunity', 'Case'
        };
        
        return standardObjects.contains(objectName) || objectName.endsWith('__c');
    }
    
    private Boolean isSupportedFieldType(Schema.DescribeFieldResult fieldDescribe) {
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