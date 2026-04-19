@isTest
public with sharing class MatchingRuleControllerTest {

    // ===================== HELPERS =====================

    private static ADM_MatchingRule__c createValidRule() {
        return new ADM_MatchingRule__c(
            DeveloperName__c = 'Controller_Test_Rule',
            MasterLabel__c = 'Controller Test Rule',
            SobjectType__c = 'Contact',
            IsActive__c = true
        );
    }

    private static List<ADM_MatchingRuleItem__c> createValidItems() {
        return new List<ADM_MatchingRuleItem__c>{
            new ADM_MatchingRuleItem__c(
                Field__c = 'Email',
                MatchingMethod__c = 'Exact',
                Weight__c = 70,
                SortOrder__c = 1
            ),
            new ADM_MatchingRuleItem__c(
                Field__c = 'Name',
                MatchingMethod__c = 'Fuzzy',
                Weight__c = 30,
                SortOrder__c = 2
            )
        };
    }

    // ===================== SAVE =====================

    @isTest
    static void testSaveFullRuleSuccess() {
        Id ruleId = MatchingRuleController.saveFullRule(
            createValidRule(),
            createValidItems()
        );

        System.assertNotEquals(null, ruleId);

        // ✔ FIX: SINGLE OBJECT ONLY
        MatchingRuleWrapper wrapper =
            MatchingRuleController.getFullRule(ruleId);

        System.assertEquals('Controller_Test_Rule', wrapper.rule.DeveloperName__c);
        System.assertEquals(2, wrapper.items.size());
    }

    // ===================== INVALID SAVE =====================

    @isTest
    static void testSaveFullRuleWithInvalidData() {
        ADM_MatchingRule__c rule = createValidRule();
        rule.DeveloperName__c = '';

        try {
            Test.startTest();
            MatchingRuleController.saveFullRule(rule, createValidItems());
            Test.stopTest();

            System.assert(false);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('nom technique'));
        }
    }

    // ===================== GET =====================

    @isTest
    static void testGetFullRuleSuccess() {
        Id ruleId = MatchingRuleController.saveFullRule(
            createValidRule(),
            createValidItems()
        );

        Test.startTest();
        MatchingRuleWrapper wrapper =
            MatchingRuleController.getFullRule(ruleId);
        Test.stopTest();

        System.assertNotEquals(null, wrapper.rule);
        System.assertEquals(2, wrapper.items.size());
    }

    @isTest
    static void testGetFullRuleWithInvalidId() {
        try {
            Test.startTest();
            MatchingRuleController.getFullRule('a0B000000000000');
            Test.stopTest();

            System.assert(false);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Aucune règle trouvée'));
        }
    }

    // ===================== DELETE =====================

    @isTest
    static void testDeleteRuleSuccess() {
        Id ruleId = MatchingRuleController.saveFullRule(
            createValidRule(),
            createValidItems()
        );

        Test.startTest();
        MatchingRuleController.deleteRule(ruleId);
        Test.stopTest();

        try {
            MatchingRuleController.getFullRule(ruleId);
            System.assert(false);
        } catch (AuraHandledException e) {
            System.assert(e.getMessage().contains('Aucune règle trouvée'));
        }
    }

    // ===================== LIST =====================

    @isTest
    static void testListRules() {
        MatchingRuleController.saveFullRule(
            createValidRule(),
            createValidItems()
        );

        ADM_MatchingRule__c rule2 = createValidRule();
        rule2.DeveloperName__c = 'Rule_2';

        MatchingRuleController.saveFullRule(rule2, createValidItems());

        Test.startTest();
        List<ADM_MatchingRule__c> rules =
            MatchingRuleController.listRules();
        Test.stopTest();

        System.assert(rules.size() >= 2);
    }

    // ===================== TOGGLE =====================

    @isTest
    static void testToggleActive() {
        ADM_MatchingRule__c rule = createValidRule();
        rule.IsActive__c = false;

        Id ruleId = MatchingRuleController.saveFullRule(
            rule,
            createValidItems()
        );

        Test.startTest();
        MatchingRuleController.toggleActive(ruleId, true);
        Test.stopTest();

        MatchingRuleWrapper wrapper =
            MatchingRuleController.getFullRule(ruleId);

        System.assertEquals(true, wrapper.rule.IsActive__c);
    }

    // ===================== OBJECTS =====================

    @isTest
    static void testGetAvailableObjects() {
        Test.startTest();
        List<Map<String, String>> objects =
            MatchingRuleController.getAvailableObjects();
        Test.stopTest();

        System.assert(objects.size() > 0);
    }

    @isTest
    static void testGetObjectFields() {
        Test.startTest();
        List<Map<String, String>> fields =
            MatchingRuleController.getObjectFields('Contact');
        Test.stopTest();

        System.assert(fields.size() > 0);
    }

    @isTest
    static void testGetObjectFieldsInvalid() {
        Test.startTest();
        List<Map<String, String>> fields =
            MatchingRuleController.getObjectFields('InvalidObject');
        Test.stopTest();

        System.assertEquals(0, fields.size());
    }
}