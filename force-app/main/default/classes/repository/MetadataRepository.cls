public with sharing class MetadataRepository {

    public Boolean objectExists(String objectName) {
        if (String.isBlank(objectName)) return false;
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        return gd.containsKey(objectName.toLowerCase());
    }

    public List<Map<String, String>> getAllObjects() {
        List<Map<String, String>> result = new List<Map<String, String>>();
        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        List<String> keys = new List<String>(gd.keySet());

        for (Integer i = 0; i < keys.size(); i++) {
            String key = keys[i];
            if (!isSupportedObject(key)) {
                // rien
            } else {
                String lbl   = gd.get(key).getDescribe().getLabel();
                String nm    = gd.get(key).getDescribe().getName();
                Boolean acc  = gd.get(key).getDescribe().isAccessible();
                if (acc) {
                    Map<String, String> entry = new Map<String, String>();
                    entry.put('label', lbl);
                    entry.put('value', nm);
                    result.add(entry);
                }
            }
        }

        result.sort(new LabelComparator());
        return result;
    }

    public List<Map<String, String>> getObjectFields(String objectName) {
        List<Map<String, String>> result = new List<Map<String, String>>();
        if (String.isBlank(objectName)) return result;

        Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
        if (!gd.containsKey(objectName.toLowerCase())) return result;

        Map<String, Schema.SObjectField> fieldMap =
            gd.get(objectName.toLowerCase()).getDescribe().fields.getMap();

        List<String> fieldKeys = new List<String>(fieldMap.keySet());

        for (Integer i = 0; i < fieldKeys.size(); i++) {
            String fk        = fieldKeys[i];
            String flabel    = fieldMap.get(fk).getDescribe().getLabel();
            String fname     = fieldMap.get(fk).getDescribe().getName();
            Boolean facc     = fieldMap.get(fk).getDescribe().isAccessible();
            Boolean ftype    = isSupportedFieldType(fieldMap.get(fk).getDescribe().getType());
            if (ftype && facc) {
                Map<String, String> entry = new Map<String, String>();
                entry.put('label', flabel);
                entry.put('value', fname);
                result.add(entry);
            }
        }

        result.sort(new LabelComparator());
        return result;
    }

    private Boolean isSupportedObject(String apiNameLower) {
    // Exclure les objets système évidents
    if (apiNameLower.startsWith('__'))              return false;
    if (apiNameLower.endsWith('__tag'))             return false;
    if (apiNameLower.endsWith('__history'))         return false;
    if (apiNameLower.endsWith('__share'))           return false;
    if (apiNameLower.endsWith('__feed'))            return false;
    if (apiNameLower.endsWith('__changeevent'))     return false;
    
    // Tous les objets customs sont acceptés
    if (apiNameLower.endsWith('__c')) return true;
    
    // Liste blanche des objets standards métier
    Set<String> whitelist = new Set<String>{
        // CRM Core
        'account', 'contact', 'lead', 'opportunity', 'case',
        'campaign', 'campaignmember', 'opportunitycontactrole',
        'opportunitylineitem', 'contactpointaddress', 'contactpointemail',
        'contactpointphone', 'contactpointtypepreference', 'contactrequest',
        
        // Produits et actifs
        'product2', 'pricebook2', 'pricebookentry', 'asset', 'contract',
        'quote', 'order', 'orderitem', 'quotelineitem', 'entitlement',
        
        // Service et support
        'solution', 'idea', 'ideacomment', 'casecomment', 'casecontactrole',
        'casesolution', 'servicecontract', 'contractcontactrole', 'partner',
        
        // Marketing
        'marketinglink', 'marketinglinktype', 'listemail', 'emailmessage',
        'emailtemplate', 'campaignmemberstatus',
        
        // Commerce
        'webstore', 'webstorecatalog', 'cartitem', 'cartcheckout',
        'paymentauthorization', 'paymentgateway', 'refund', 'payment',
        
        // Événements et tâches (objets d'activité)
        'event', 'task', 'note', 'calendar', 'calendarevent'
        
        // Objets personnalisés (déjà traités plus haut)
    };
    
    return whitelist.contains(apiNameLower);
}

    private Boolean isSupportedFieldType(Schema.DisplayType dt) {
        Set<Schema.DisplayType> supported = new Set<Schema.DisplayType>{
            Schema.DisplayType.String,
            Schema.DisplayType.Email,
            Schema.DisplayType.Phone,
            Schema.DisplayType.TextArea,
            Schema.DisplayType.URL,
            Schema.DisplayType.Picklist
        };
        return supported.contains(dt);
    }

    private class LabelComparator implements Comparator<Map<String, String>> {
        public Integer compare(Map<String, String> a, Map<String, String> b) {
            String la = a.get('label') != null ? a.get('label') : '';
            String lb = b.get('label') != null ? b.get('label') : '';
            return la.compareTo(lb);
        }
    }

    public Map<String, String> getObjectLabelsMap() {
    Map<String, String> labels = new Map<String, String>();
    Map<String, Schema.SObjectType> gd = Schema.getGlobalDescribe();
    
    for (String apiName : gd.keySet()) {
        // ✅ Garder la casse originale pour la clé
        if (isSupportedObject(apiName.toLowerCase())) {
            labels.put(apiName, gd.get(apiName).getDescribe().getLabel());
        }
    }
    return labels;
}
}