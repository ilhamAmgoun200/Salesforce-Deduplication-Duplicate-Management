@isTest
public with sharing class MatchingRuleServiceTest {
    
    // Helper method to create a valid rule
    private static ADM_MatchingRule__c createValidRule() {
        return new ADM_MatchingRule__c(
            DeveloperName__c = 'Test_Service_Rule',
            MasterLabel__c = 'Test Service Rule',
            SobjectType__c = 'Contact',
            IsActive__c = true
        );
    }
    
    // Helper method to create valid items
    private static List<ADM_MatchingRuleItem__c> createValidItems(Id ruleId) {
        List<ADM_MatchingRuleItem__c> items = new List<ADM_MatchingRuleItem__c>();
        items.add(new ADM_MatchingRuleItem__c(
            MatchingRule__c = ruleId,
            Field__c = 'Email',
            MatchingMethod__c = 'Exact',
            Weight__c = 70,
            SortOrder__c = 1
        ));
        items.add(new ADM_MatchingRuleItem__c(
            MatchingRule__c = ruleId,
            Field__c = 'Name',
            MatchingMethod__c = 'Fuzzy',
            Weight__c = 30,
            SortOrder__c = 2
        ));
        return items;
    }
    
    // ========== Tests pour getFullRule ==========
    
    @isTest
    static void testGetFullRuleSuccess() {
        MatchingRuleRepository repo = new MatchingRuleRepository();
        MetadataRepository metadataRepo = new MetadataRepository();
        
        // Create a rule first
        ADM_MatchingRule__c rule = createValidRule();
        repo.saveRule(rule);
        
        List<ADM_MatchingRuleItem__c> items = createValidItems(rule.Id);
        repo.saveItems(rule.Id, items);
        
        MatchingRuleService service = new MatchingRuleService(repo, metadataRepo);
        MatchingRuleWrapper wrapper = service.getFullRule(rule.Id);
        
        System.assertNotEquals(null, wrapper.rule);
        System.assertEquals(2, wrapper.items.size());
        System.assertEquals('Test_Service_Rule', wrapper.rule.DeveloperName__c);
    }
    
    @isTest
    static void testGetFullRuleWithNullId() {
        MatchingRuleService service = new MatchingRuleService();
        
        try {
            service.getFullRule(null);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('ne peut pas être null'));
        }
    }
    
    @isTest
    static void testGetFullRuleWithNonExistentId() {
        MatchingRuleService service = new MatchingRuleService();
        
        try {
            service.getFullRule('a0B000000000000');
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('Aucune règle trouvée'));
        }
    }
    
    // ========== Tests pour saveFullRule ==========
    
    @isTest
    static void testSaveFullRuleSuccess() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        
        Id ruleId = service.saveFullRule(rule, items);
        
        System.assertNotEquals(null, ruleId);
        
        // Verify rule was saved
        MatchingRuleRepository repo = new MatchingRuleRepository();
        ADM_MatchingRule__c savedRule = repo.getRule(ruleId);
        System.assertEquals('Test_Service_Rule', savedRule.DeveloperName__c);
        
        // Verify items were saved
        List<ADM_MatchingRuleItem__c> savedItems = repo.getItemsByRuleId(ruleId);
        System.assertEquals(2, savedItems.size());
    }
    
    @isTest
    static void testSaveFullRuleWithNullRule() {
        MatchingRuleService service = new MatchingRuleService();
        
        try {
            service.saveFullRule(null, new List<ADM_MatchingRuleItem__c>());
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('ne peut pas être null'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithEmptyItems() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        
        try {
            service.saveFullRule(rule, new List<ADM_MatchingRuleItem__c>());
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('au moins un item'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithNullItems() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        
        try {
            service.saveFullRule(rule, null);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('au moins un item'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithMissingDeveloperName() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        rule.DeveloperName__c = '';
        
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        
        try {
            service.saveFullRule(rule, items);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('nom technique'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithMissingSobjectType() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        rule.SobjectType__c = '';
        
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        
        try {
            service.saveFullRule(rule, items);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('objet cible'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithInvalidWeight() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        items[0].Weight__c = 150; // Invalid weight > 100
        
        try {
            service.saveFullRule(rule, items);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('poids'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithMissingField() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        items[0].Field__c = '';
        
        try {
            service.saveFullRule(rule, items);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('champ'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithMissingMatchingMethod() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        items[0].MatchingMethod__c = '';
        
        try {
            service.saveFullRule(rule, items);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('méthode de matching'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithMissingSortOrder() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        items[0].SortOrder__c = null;
        
        try {
            service.saveFullRule(rule, items);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('ordre'));
        }
    }
    
    @isTest
    static void testSaveFullRuleWithDuplicateDeveloperName() {
        MatchingRuleService service = new MatchingRuleService();
        
        // Create first rule
        ADM_MatchingRule__c rule1 = createValidRule();
        List<ADM_MatchingRuleItem__c> items1 = createValidItems(null);
        service.saveFullRule(rule1, items1);
        
        // Create second rule with same DeveloperName
        ADM_MatchingRule__c rule2 = createValidRule();
        rule2.DeveloperName__c = 'Test_Service_Rule'; // Same name
        List<ADM_MatchingRuleItem__c> items2 = createValidItems(null);
        
        try {
            service.saveFullRule(rule2, items2);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('existe déjà'));
        }
    }
    
    // ========== Tests pour deleteFullRule ==========
    
    @isTest
    static void testDeleteFullRuleSuccess() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        Id ruleId = service.saveFullRule(rule, items);
        
        // Verify rule exists
        MatchingRuleWrapper wrapper = service.getFullRule(ruleId);
        System.assertNotEquals(null, wrapper.rule);
        
        // Delete
        service.deleteFullRule(ruleId);
        
        // Verify rule no longer exists
        try {
            service.getFullRule(ruleId);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('Aucune règle trouvée'));
        }
    }
    
    @isTest
    static void testDeleteFullRuleWithNullId() {
        MatchingRuleService service = new MatchingRuleService();
        
        try {
            service.deleteFullRule(null);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('ne peut pas être null'));
        }
    }
    
    @isTest
    static void testDeleteFullRuleWithNonExistentId() {
        MatchingRuleService service = new MatchingRuleService();
        
        try {
            service.deleteFullRule('a0B000000000000');
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('Aucune règle trouvée'));
        }
    }
    
    // ========== Tests pour listRules ==========
    
    @isTest
    static void testListRules() {
        MatchingRuleService service = new MatchingRuleService();
        
        // Create some rules
        ADM_MatchingRule__c rule1 = createValidRule();
        rule1.DeveloperName__c = 'List_Test_Rule_1';
        List<ADM_MatchingRuleItem__c> items1 = createValidItems(null);
        service.saveFullRule(rule1, items1);
        
        ADM_MatchingRule__c rule2 = createValidRule();
        rule2.DeveloperName__c = 'List_Test_Rule_2';
        List<ADM_MatchingRuleItem__c> items2 = createValidItems(null);
        service.saveFullRule(rule2, items2);
        
        List<ADM_MatchingRule__c> rules = service.listRules();
        
        System.assert(rules.size() >= 2);
    }
    
    // ========== Tests pour toggleActive ==========
    
    @isTest
    static void testToggleActive() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        rule.IsActive__c = false;
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        Id ruleId = service.saveFullRule(rule, items);
        
        // Activate
        service.toggleActive(ruleId, true);
        MatchingRuleWrapper wrapper = service.getFullRule(ruleId);
        System.assertEquals(true, wrapper.rule.IsActive__c);
        
        // Deactivate
        service.toggleActive(ruleId, false);
        wrapper = service.getFullRule(ruleId);
        System.assertEquals(false, wrapper.rule.IsActive__c);
    }
    
    @isTest
    static void testToggleActiveWithNullId() {
        MatchingRuleService service = new MatchingRuleService();
        
        try {
            service.toggleActive(null, true);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('ne peut pas être null'));
        }
    }
    
    @isTest
    static void testToggleActiveWithNullIsActive() {
        MatchingRuleService service = new MatchingRuleService();
        
        ADM_MatchingRule__c rule = createValidRule();
        List<ADM_MatchingRuleItem__c> items = createValidItems(null);
        Id ruleId = service.saveFullRule(rule, items);
        
        try {
            service.toggleActive(ruleId, null);
            System.assert(false, 'Should have thrown exception');
        } catch (IllegalArgumentException e) {
            System.assert(e.getMessage().contains('ne peut pas être null'));
        }
    }


    // Test pour couvrir l'erreur dans saveFullRule (rollback)
@isTest
static void testSaveFullRuleRollbackScenario() {
    MatchingRuleService service = new MatchingRuleService();
    
    ADM_MatchingRule__c rule = createValidRule();
    
    // Créer un item avec un poids invalide pour forcer l'erreur
    List<ADM_MatchingRuleItem__c> invalidItems = new List<ADM_MatchingRuleItem__c>();
    invalidItems.add(new ADM_MatchingRuleItem__c(
        Field__c = 'Email',
        MatchingMethod__c = 'Exact',
        Weight__c = null,  // Null weight - should cause validation error
        SortOrder__c = 1
    ));
    
    try {
        service.saveFullRule(rule, invalidItems);
        System.assert(false, 'Should have thrown exception');
    } catch (IllegalArgumentException e) {
        System.assert(e.getMessage().contains('poids'));
    }
    
    // Verify rule was not created (rollback worked)
    List<ADM_MatchingRule__c> rules = service.listRules();
    Boolean ruleExists = false;
    for (ADM_MatchingRule__c r : rules) {
        if (r.DeveloperName__c == rule.DeveloperName__c) {
            ruleExists = true;
            break;
        }
    }
    System.assertEquals(false, ruleExists, 'Rule should not exist after rollback');
}
}