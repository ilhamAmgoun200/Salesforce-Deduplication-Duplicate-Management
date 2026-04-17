@isTest
public with sharing class MatchingRuleRepositoryTest {
    
    @isTest
    static void testSaveAndGetRule() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_1',
            MasterLabel__c = 'Test Rule 1',
            SobjectType__c = 'Contact',
            IsActive__c = true
        );
        
        repo.saveRule(rule);
        
        System.assertNotEquals(null, rule.Id, 'Id should be generated after insert');
        
        ADM_MatchingRule__c retrieved = repo.getRule(rule.Id);
        
        System.assertEquals('Test_Rule_1', retrieved.DeveloperName__c);
        System.assertEquals('Contact', retrieved.SobjectType__c);
        System.assertEquals(true, retrieved.IsActive__c);
    }
    
    @isTest
    static void testUpdateRule() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Update',
            MasterLabel__c = 'Test Rule Update',
            SobjectType__c = 'Contact',
            IsActive__c = true
        );
        
        repo.saveRule(rule);
        
        rule.IsActive__c = false;
        rule.Description__c = 'Updated description';
        repo.saveRule(rule);
        
        ADM_MatchingRule__c retrieved = repo.getRule(rule.Id);
        
        System.assertEquals(false, retrieved.IsActive__c);
        System.assertEquals('Updated description', retrieved.Description__c);
    }
    
    @isTest
    static void testGetAllRules() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule1 = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_GetAll_1',
            MasterLabel__c = 'Test Rule GetAll 1',
            SobjectType__c = 'Contact'
        );
        
        ADM_MatchingRule__c rule2 = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_GetAll_2',
            MasterLabel__c = 'Test Rule GetAll 2',
            SobjectType__c = 'Lead'
        );
        
        repo.saveRule(rule1);
        repo.saveRule(rule2);
        
        List<ADM_MatchingRule__c> rules = repo.getAllRules();
        
        System.assert(rules.size() >= 2, 'Should have at least 2 rules');
    }
    
    @isTest
    static void testDeleteRule() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Delete',
            MasterLabel__c = 'Test Rule Delete',
            SobjectType__c = 'Contact'
        );
        
        repo.saveRule(rule);
        System.assertNotEquals(null, rule.Id);
        
        repo.deleteRule(rule.Id);
        
        ADM_MatchingRule__c deleted = repo.getRule(rule.Id);
        System.assertEquals(null, deleted, 'Rule should be deleted');
    }
    
    @isTest
    static void testToggleActive() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Toggle',
            MasterLabel__c = 'Test Rule Toggle',
            SobjectType__c = 'Contact',
            IsActive__c = false
        );
        
        repo.saveRule(rule);
        
        repo.toggleActive(rule.Id, true);
        ADM_MatchingRule__c activated = repo.getRule(rule.Id);
        System.assertEquals(true, activated.IsActive__c);
        
        repo.toggleActive(rule.Id, false);
        ADM_MatchingRule__c deactivated = repo.getRule(rule.Id);
        System.assertEquals(false, deactivated.IsActive__c);
    }
    
    @isTest
    static void testSaveAndGetItems() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Items',
            MasterLabel__c = 'Test Rule Items',
            SobjectType__c = 'Contact'
        );
        
        repo.saveRule(rule);
        
        List<ADM_MatchingRuleItem__c> items = new List<ADM_MatchingRuleItem__c>();
        items.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Email',
            MatchingMethod__c = 'Exact',
            Weight__c = 70,
            SortOrder__c = 1
        ));
        items.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Phone',
            MatchingMethod__c = 'Fuzzy',
            Weight__c = 30,
            SortOrder__c = 2
        ));
        
        repo.saveItems(rule.Id, items);
        
        List<ADM_MatchingRuleItem__c> retrieved = repo.getItemsByRuleId(rule.Id);
        
        System.assertEquals(2, retrieved.size(), 'Should have 2 items');
        System.assertEquals('Email', retrieved[0].Field__c);
        System.assertEquals('Phone', retrieved[1].Field__c);
    }
    
    @isTest
    static void testSaveItemsReplacesOldItems() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Replace',
            MasterLabel__c = 'Test Rule Replace',
            SobjectType__c = 'Contact'
        );
        
        repo.saveRule(rule);
        
        // First batch of items
        List<ADM_MatchingRuleItem__c> firstItems = new List<ADM_MatchingRuleItem__c>();
        firstItems.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Email',
            MatchingMethod__c = 'Exact',
            Weight__c = 100,
            SortOrder__c = 1
        ));
        repo.saveItems(rule.Id, firstItems);
        
        // Second batch replaces the first
        List<ADM_MatchingRuleItem__c> secondItems = new List<ADM_MatchingRuleItem__c>();
        secondItems.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Name',
            MatchingMethod__c = 'Fuzzy',
            Weight__c = 100,
            SortOrder__c = 1
        ));
        repo.saveItems(rule.Id, secondItems);
        
        List<ADM_MatchingRuleItem__c> retrieved = repo.getItemsByRuleId(rule.Id);
        
        System.assertEquals(1, retrieved.size(), 'Should have 1 item after replacement');
        System.assertEquals('Name', retrieved[0].Field__c);
    }
    
    @isTest
    static void testDeleteItemsByRuleId() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Delete_Items',
            MasterLabel__c = 'Test Rule Delete Items',
            SobjectType__c = 'Contact'
        );
        
        repo.saveRule(rule);
        
        List<ADM_MatchingRuleItem__c> items = new List<ADM_MatchingRuleItem__c>();
        items.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Email',
            MatchingMethod__c = 'Exact',
            Weight__c = 100,
            SortOrder__c = 1
        ));
        repo.saveItems(rule.Id, items);
        
        List<ADM_MatchingRuleItem__c> beforeDelete = repo.getItemsByRuleId(rule.Id);
        System.assertEquals(1, beforeDelete.size());
        
        repo.deleteItemsByRuleId(rule.Id);
        
        List<ADM_MatchingRuleItem__c> afterDelete = repo.getItemsByRuleId(rule.Id);
        System.assertEquals(0, afterDelete.size());
    }
    
    @isTest
    static void testSaveFullRule() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Full',
            MasterLabel__c = 'Test Rule Full',
            SobjectType__c = 'Contact',
            IsActive__c = true
        );
        
        List<ADM_MatchingRuleItem__c> items = new List<ADM_MatchingRuleItem__c>();
        items.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Email',
            MatchingMethod__c = 'Exact',
            Weight__c = 70,
            SortOrder__c = 1
        ));
        items.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Phone',
            MatchingMethod__c = 'Fuzzy',
            Weight__c = 30,
            SortOrder__c = 2
        ));
        
        Id ruleId = repo.saveFullRule(rule, items);
        
        System.assertNotEquals(null, ruleId);
        
        ADM_MatchingRule__c savedRule = repo.getRule(ruleId);
        System.assertEquals('Test_Rule_Full', savedRule.DeveloperName__c);
        
        List<ADM_MatchingRuleItem__c> savedItems = repo.getItemsByRuleId(ruleId);
        System.assertEquals(2, savedItems.size());
    }
    
    @isTest
    static void testSaveFullRuleRollbackOnError() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Rule_Rollback',
            MasterLabel__c = 'Test Rule Rollback',
            SobjectType__c = 'Contact'
        );
        
        // Create an item with invalid weight (null should cause error)
        List<ADM_MatchingRuleItem__c> invalidItems = new List<ADM_MatchingRuleItem__c>();
        invalidItems.add(new ADM_MatchingRuleItem__c(
            Field__c = 'Email',
            MatchingMethod__c = 'Exact',
            Weight__c = null,  // Invalid: weight is required
            SortOrder__c = 1
        ));
        
        try {
            repo.saveFullRule(rule, invalidItems);
            System.assert(false, 'Should have thrown an exception');
        } catch (Exception e) {
            System.assert(e.getMessage().contains('Erreur'), 'Exception should be thrown');
        }
        
        // Rule should not have been created
        ADM_MatchingRule__c notCreated = repo.getRule(rule.Id);
        System.assertEquals(null, notCreated, 'Rule should not exist after rollback');
    }
    
    @isTest
    static void testIsDeveloperNameUnique() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c rule1 = new ADM_MatchingRule__c(
            DeveloperName__c = 'Unique_Name_Test',
            MasterLabel__c = 'Unique Name Test',
            SobjectType__c = 'Contact'
        );
        
        repo.saveRule(rule1);
        
        Boolean isUnique = repo.isDeveloperNameUnique('Unique_Name_Test', rule1.Id);
        System.assertEquals(true, isUnique, 'Same ID should be considered unique');
        
        Boolean isNotUnique = repo.isDeveloperNameUnique('Unique_Name_Test', null);
        System.assertEquals(false, isNotUnique, 'Duplicate name should not be unique');
        
        Boolean isUniqueDifferent = repo.isDeveloperNameUnique('Different_Name', null);
        System.assertEquals(true, isUniqueDifferent, 'Different name should be unique');
    }
    
    @isTest
    static void testGetRuleWithNullId() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        ADM_MatchingRule__c result = repo.getRule(null);
        
        System.assertEquals(null, result);
    }
    
    @isTest
    static void testGetItemsByRuleIdWithNullId() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        
        List<ADM_MatchingRuleItem__c> result = repo.getItemsByRuleId(null);
        
        System.assertEquals(0, result.size());
    }


    // Test pour couvrir l'erreur dans saveFullRule (Database.rollback)
@isTest
static void testSaveFullRuleWithDatabaseError() {
    MatchingRuleRepository repo = new MatchingRuleRepository();
    
    ADM_MatchingRule__c rule = new ADM_MatchingRule__c(
        DeveloperName__c = 'Test_Rollback_Rule',
        MasterLabel__c = 'Test Rollback Rule',
        SobjectType__c = 'Contact'
    );
    
    // Créer un item avec un champ obligatoire manquant
    List<ADM_MatchingRuleItem__c> invalidItems = new List<ADM_MatchingRuleItem__c>();
    invalidItems.add(new ADM_MatchingRuleItem__c(
        // Missing Field__c - will cause DML exception
        MatchingMethod__c = 'Exact',
        Weight__c = 70,
        SortOrder__c = 1
    ));
    
    try {
        repo.saveFullRule(rule, invalidItems);
        System.assert(false, 'Should have thrown exception');
    } catch (Exception e) {
        System.assert(e.getMessage().contains('Erreur') || e.getMessage().contains('field'), 
            'Exception should be thrown');
    }
    
    // Verify rule was not created
    ADM_MatchingRule__c savedRule = repo.getRule(rule.Id);
    System.assertEquals(null, savedRule, 'Rule should not exist after rollback');
}
}