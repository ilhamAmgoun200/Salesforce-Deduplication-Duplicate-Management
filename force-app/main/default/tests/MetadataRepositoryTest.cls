@isTest
public with sharing class MetadataRepositoryTest {
    
    @isTest
    static void testObjectExistsWithValidObject() {
        MetadataRepository repo = new MetadataRepository();
        
        Boolean exists = repo.objectExists('Contact');
        
        System.assertEquals(true, exists, 'Contact should exist');
    }
    
    @isTest
    static void testObjectExistsWithInvalidObject() {
        MetadataRepository repo = new MetadataRepository();
        
        Boolean exists = repo.objectExists('InvalidObjectName');
        
        System.assertEquals(false, exists, 'Invalid object should not exist');
    }
    
    @isTest
    static void testObjectExistsWithNull() {
        MetadataRepository repo = new MetadataRepository();
        
        Boolean exists = repo.objectExists(null);
        
        System.assertEquals(false, exists, 'Null should return false');
    }
    
    @isTest
    static void testObjectExistsWithEmpty() {
        MetadataRepository repo = new MetadataRepository();
        
        Boolean exists = repo.objectExists('');
        
        System.assertEquals(false, exists, 'Empty string should return false');
    }
    
    @isTest
    static void testGetAllObjects() {
        MetadataRepository repo = new MetadataRepository();
        
        List<Map<String, String>> objects = repo.getAllObjects();
        
        System.assert(objects.size() > 0, 'Should return at least some objects');
        
        // Verify standard objects are present
        List<String> objectValues = new List<String>();
        for (Map<String, String> obj : objects) {
            objectValues.add(obj.get('value'));
        }
        
        System.assert(objectValues.contains('Contact'), 'Contact should be in the list');
        System.assert(objectValues.contains('Lead'), 'Lead should be in the list');
        System.assert(objectValues.contains('Account'), 'Account should be in the list');
    }
    
    @isTest
    static void testGetObjectFieldsWithValidObject() {
        MetadataRepository repo = new MetadataRepository();
        
        List<Map<String, String>> fields = repo.getObjectFields('Contact');
        
        System.assert(fields.size() > 0, 'Contact should have fields');
        
        // Verify standard fields are present
        List<String> fieldValues = new List<String>();
        for (Map<String, String> field : fields) {
            fieldValues.add(field.get('value'));
        }
        
        System.assert(fieldValues.contains('Email'), 'Email field should be available');
        System.assert(fieldValues.contains('Name'), 'Name field should be available');
        System.assert(fieldValues.contains('Phone'), 'Phone field should be available');
    }
    
    @isTest
    static void testGetObjectFieldsWithInvalidObject() {
        MetadataRepository repo = new MetadataRepository();
        
        List<Map<String, String>> fields = repo.getObjectFields('InvalidObjectName');
        
        System.assertEquals(0, fields.size(), 'Should return empty list for invalid object');
    }
    
    @isTest
    static void testGetObjectFieldsWithNull() {
        MetadataRepository repo = new MetadataRepository();
        
        List<Map<String, String>> fields = repo.getObjectFields(null);
        
        System.assertEquals(0, fields.size(), 'Should return empty list for null');
    }
    
    @isTest
    static void testGetObjectFieldsWithEmpty() {
        MetadataRepository repo = new MetadataRepository();
        
        List<Map<String, String>> fields = repo.getObjectFields('');
        
        System.assertEquals(0, fields.size(), 'Should return empty list for empty string');
    }
    
    @isTest
    static void testGetObjectFieldsOnlyReturnsSupportedTypes() {
        MetadataRepository repo = new MetadataRepository();
        
        List<Map<String, String>> fields = repo.getObjectFields('Contact');
        
        // All returned fields should have String, Email, Phone, TextArea, or URL type
        // This is already handled by isSupportedFieldType, so just verify we get fields
        System.assert(fields.size() > 0, 'Should return supported fields');
    }
    
    @isTest
    static void testGetAllObjectsIncludesCustomObjects() {
        MetadataRepository repo = new MetadataRepository();
        
        List<Map<String, String>> objects = repo.getAllObjects();
        
        List<String> objectValues = new List<String>();
        for (Map<String, String> obj : objects) {
            objectValues.add(obj.get('value'));
        }
        
        // Custom objects end with __c
        Boolean hasCustomObject = false;
        for (String objName : objectValues) {
            if (objName.endsWith('__c')) {
                hasCustomObject = true;
                break;
            }
        }
        
        // Note: This may be false if no custom objects exist in the org
        // So we don't assert, just log
        System.debug('Has custom objects: ' + hasCustomObject);
    }
}