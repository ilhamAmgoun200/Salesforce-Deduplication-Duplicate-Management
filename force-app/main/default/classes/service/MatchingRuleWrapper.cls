public class MatchingRuleWrapper {

    @AuraEnabled
    public ADM_MatchingRule__c rule { get; set; }

    @AuraEnabled
    public List<ADM_MatchingRuleItem__c> items { get; set; }

    public MatchingRuleWrapper(ADM_MatchingRule__c rule, List<ADM_MatchingRuleItem__c> items) {
        this.rule  = rule;
        this.items = (items != null) ? items : new List<ADM_MatchingRuleItem__c>();
    }
}