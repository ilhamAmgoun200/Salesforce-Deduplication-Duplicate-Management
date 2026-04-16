import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import getRules from '@salesforce/apex/DedupMatchingRuleController.getRules';
// import saveRule from '@salesforce/apex/DedupMatchingRuleController.saveRule';
// import deleteRule from '@salesforce/apex/DedupMatchingRuleController.deleteRule';
// import toggleRule from '@salesforce/apex/DedupMatchingRuleController.toggleRule';

const OBJECT_BADGE_COLORS = {
    Lead:    'background:#f88962;color:#ffffff',
    Contact: 'background:#a094ed;color:#ffffff',
    Account: 'background:#57b5e5;color:#ffffff'
};

const DEFAULT_RULE = {
    id: null,
    name: '',
    objectApiName: 'Lead',
    matchStrategy: 'EXACT',
    confidenceThreshold: 75,
    autoAction: 'FLAG',
    isActive: true,
    filterLogic: '',
    criteria: []
};

const DEFAULT_CRITERION = {
    id: null,
    fieldApiName: 'Email',
    fieldLabel: 'Email',
    matchType: 'EXACT',
    weight: 50,
    matchBlankFields: false
};

/**
 * Enrichit les critères avec les propriétés d'affichage :
 *  - orderNumber  : numéro d'ordre (1-based)
 *  - showAndSeparator : true si ce n'est pas le premier critère (affiche "ET" au-dessus)
 *  - separatorKey : clé unique pour le séparateur
 */
function enrichCriteria(criteria) {
    return criteria.map((c, idx) => ({
        ...c,
        orderNumber: idx + 1,
        showAndSeparator: idx > 0,
        separatorKey: `sep_${c.id}`
    }));
}

export default class DedupMatchingRules extends LightningElement {

    @track rules = [
        {
            id: 'r1',
            name: 'Lead — Email exact match',
            objectApiName: 'Lead',
            objectLabel: 'Lead',
            matchStrategy: 'EXACT',
            matchStrategyLabel: 'Matching exact',
            isActive: true,
            statusLabel: 'Active',
            statusClass: 'badge-success',
            objBadgeStyle: OBJECT_BADGE_COLORS['Lead'],
            toggleIcon: 'utility:pause',
            toggleTitle: 'Désactiver',
            confidenceLabel: '90%',
            matchesFound: '1 842',
            mergedCount: '1 204',
            lastRunLabel: 'Aujourd\'hui 09:42',
            filterLogic: '',
            criteria: enrichCriteria([
                { id: 'c1', fieldLabel: 'Email',         matchType: 'Exact', weightLabel: '60 pts', matchBlankFields: false },
                { id: 'c2', fieldLabel: 'Prénom + Nom',  matchType: 'Exact', weightLabel: '40 pts', matchBlankFields: false }
            ])
        },
        {
            id: 'r2',
            name: 'Contact — Nom fuzzy + Téléphone',
            objectApiName: 'Contact',
            objectLabel: 'Contact',
            matchStrategy: 'FUZZY',
            matchStrategyLabel: 'Matching fuzzy',
            isActive: true,
            statusLabel: 'Active',
            statusClass: 'badge-success',
            objBadgeStyle: OBJECT_BADGE_COLORS['Contact'],
            toggleIcon: 'utility:pause',
            toggleTitle: 'Désactiver',
            confidenceLabel: '75%',
            matchesFound: '1 450',
            mergedCount: '340',
            lastRunLabel: 'Hier 18:00',
            filterLogic: '1 OR 2',
            criteria: enrichCriteria([
                { id: 'c3', fieldLabel: 'Nom',       matchType: 'Fuzzy', weightLabel: '40 pts', matchBlankFields: false },
                { id: 'c4', fieldLabel: 'Téléphone', matchType: 'Exact', weightLabel: '60 pts', matchBlankFields: true  }
            ])
        },
        {
            id: 'r3',
            name: 'Account — Nom + Adresse',
            objectApiName: 'Account',
            objectLabel: 'Account',
            matchStrategy: 'MIXED',
            matchStrategyLabel: 'Matching mixte',
            isActive: false,
            statusLabel: 'Inactive',
            statusClass: 'badge-neutral',
            objBadgeStyle: OBJECT_BADGE_COLORS['Account'],
            toggleIcon: 'utility:play',
            toggleTitle: 'Activer',
            confidenceLabel: '80%',
            matchesFound: '555',
            mergedCount: '0',
            lastRunLabel: 'Il y a 3 jours',
            filterLogic: '(1 AND 2) OR 3',
            criteria: enrichCriteria([
                { id: 'c5', fieldLabel: 'Nom du compte', matchType: 'Fuzzy', weightLabel: '50 pts', matchBlankFields: false },
                { id: 'c6', fieldLabel: 'Ville',         matchType: 'Exact', weightLabel: '25 pts', matchBlankFields: true  },
                { id: 'c7', fieldLabel: 'Code postal',   matchType: 'Exact', weightLabel: '25 pts', matchBlankFields: false }
            ])
        },
        {
            id: 'r4',
            name: 'Lead — Téléphone exact',
            objectApiName: 'Lead',
            objectLabel: 'Lead',
            matchStrategy: 'EXACT',
            matchStrategyLabel: 'Matching exact',
            isActive: false,
            statusLabel: 'Inactive',
            statusClass: 'badge-neutral',
            objBadgeStyle: OBJECT_BADGE_COLORS['Lead'],
            toggleIcon: 'utility:play',
            toggleTitle: 'Activer',
            confidenceLabel: '85%',
            matchesFound: '284',
            mergedCount: '0',
            lastRunLabel: 'Jamais',
            filterLogic: '',
            criteria: enrichCriteria([
                { id: 'c8', fieldLabel: 'Téléphone', matchType: 'Exact', weightLabel: '100 pts', matchBlankFields: false }
            ])
        }
    ];

    @track filterObject = '';
    @track filterStatus = '';
    @track searchTerm = '';
    @track showModal = false;
    @track editRule = { ...DEFAULT_RULE, criteria: [] };
    @track isEditMode = false;

    get activeRulesCount() {
        return this.rules.filter(r => r.isActive).length;
    }

    get hasRules() {
        return this.filteredRules.length > 0;
    }

    get filteredRules() {
        return this.rules.filter(r => {
            const matchObj    = !this.filterObject || r.objectApiName === this.filterObject;
            const matchStatus = !this.filterStatus
                || (this.filterStatus === 'ACTIVE'   && r.isActive)
                || (this.filterStatus === 'INACTIVE' && !r.isActive);
            const matchSearch = !this.searchTerm
                || r.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            return matchObj && matchStatus && matchSearch;
        });
    }

    get modalTitle() {
        return this.isEditMode ? 'Modifier la règle' : 'Nouvelle règle de matching';
    }

    // -- Options --

    objectFilterOptions = [
        { label: 'Tous les objets', value: '' },
        { label: 'Lead',    value: 'Lead'    },
        { label: 'Contact', value: 'Contact' },
        { label: 'Account', value: 'Account' }
    ];

    statusFilterOptions = [
        { label: 'Tous les statuts', value: ''       },
        { label: 'Actives',          value: 'ACTIVE' },
        { label: 'Inactives',        value: 'INACTIVE' }
    ];

    salesforceObjectOptions = [
        { label: 'Lead',          value: 'Lead'           },
        { label: 'Contact',       value: 'Contact'        },
        { label: 'Account',       value: 'Account'        },
        { label: 'Custom Object', value: 'CustomObject__c' }
    ];

    matchStrategyOptions = [
        { label: 'Exact — tous les critères exacts',       value: 'EXACT' },
        { label: 'Fuzzy — correspondance approchée',       value: 'FUZZY' },
        { label: 'Mixte — combinaison exact + fuzzy',      value: 'MIXED' }
    ];

    autoActionOptions = [
        { label: 'Signaler uniquement (Flag)',      value: 'FLAG'          },
        { label: 'Fusionner automatiquement',       value: 'AUTO_MERGE'    },
        { label: 'Bloquer la saisie',               value: 'BLOCK'         },
        { label: 'Révision manuelle requise',       value: 'MANUAL_REVIEW' }
    ];

    fieldOptions = [
        { label: 'Email',       value: 'Email'       },
        { label: 'Prénom',      value: 'FirstName'   },
        { label: 'Nom',         value: 'LastName'    },
        { label: 'Téléphone',   value: 'Phone'       },
        { label: 'Mobile',      value: 'MobilePhone' },
        { label: 'Entreprise',  value: 'Company'     },
        { label: 'Ville',       value: 'City'        },
        { label: 'Code postal', value: 'PostalCode'  },
        { label: 'Pays',        value: 'Country'     }
    ];

    matchTypeOptions = [
        { label: 'Exact',              value: 'EXACT'    },
        { label: 'Fuzzy (Levenshtein)', value: 'FUZZY'   },
        { label: 'Contient',           value: 'CONTAINS' },
        { label: 'Synonymes',          value: 'SYNONYM'  }
    ];

    // -- Handlers --

    handleObjectFilter(event) { this.filterObject = event.detail.value; }
    handleStatusFilter(event) { this.filterStatus = event.detail.value; }
    handleSearch(event)       { this.searchTerm   = event.detail.value; }

    handleNewRule() {
        this.isEditMode = false;
        this.editRule = { ...DEFAULT_RULE, filterLogic: '', criteria: [] };
        this.showModal = true;
    }

    handleEditRule(event) {
        const ruleId = event.currentTarget.dataset.ruleId;
        const found  = this.rules.find(r => r.id === ruleId);
        if (found) {
            this.isEditMode = true;
            this.editRule   = JSON.parse(JSON.stringify(found));
            // Re-enrich so orderNumber / showAndSeparator are fresh
            this.editRule.criteria = enrichCriteria(this.editRule.criteria);
            this.showModal = true;
        }
    }

    handleToggleRule(event) {
        const ruleId = event.currentTarget.dataset.ruleId;
        const idx    = this.rules.findIndex(r => r.id === ruleId);
        if (idx >= 0) {
            const rule        = { ...this.rules[idx] };
            rule.isActive     = !rule.isActive;
            rule.statusLabel  = rule.isActive ? 'Active'    : 'Inactive';
            rule.statusClass  = rule.isActive ? 'badge-success' : 'badge-neutral';
            rule.toggleIcon   = rule.isActive ? 'utility:pause' : 'utility:play';
            rule.toggleTitle  = rule.isActive ? 'Désactiver'   : 'Activer';
            this.rules = [...this.rules.slice(0, idx), rule, ...this.rules.slice(idx + 1)];
            this.dispatchEvent(new ShowToastEvent({
                title:   rule.isActive ? 'Règle activée'    : 'Règle désactivée',
                message: `"${rule.name}" a été ${rule.isActive ? 'activée' : 'désactivée'}.`,
                variant: 'success'
            }));
            // TODO: appeler toggleRule Apex
        }
    }

    handleDeleteRule(event) {
        const ruleId = event.currentTarget.dataset.ruleId;
        this.rules   = this.rules.filter(r => r.id !== ruleId);
        this.dispatchEvent(new ShowToastEvent({
            title:   'Règle supprimée',
            message: 'La règle a été supprimée avec succès.',
            variant: 'success'
        }));
        // TODO: appeler deleteRule Apex
    }

    handleCloseModal() { this.showModal = false; }

    handleFieldChange(event) {
        const field     = event.currentTarget.dataset.field;
        this.editRule   = { ...this.editRule, [field]: event.detail.value };
    }

    handleAddCriterion() {
        const newCriterion = {
            ...DEFAULT_CRITERION,
            id:         `new_${Date.now()}`,
            fieldLabel: 'Email'
        };
        const updatedCriteria = enrichCriteria([...this.editRule.criteria, newCriterion]);
        this.editRule = { ...this.editRule, criteria: updatedCriteria };
    }

    handleCriterionChange(event) {
        const idx      = parseInt(event.currentTarget.dataset.idx, 10);
        const subField = event.currentTarget.dataset.subfield;
        const updated  = this.editRule.criteria.map((c, i) =>
            i === idx ? { ...c, [subField]: event.detail.value } : c
        );
        this.editRule = { ...this.editRule, criteria: enrichCriteria(updated) };
    }

    /**
     * Handler dédié aux checkboxes des critères (event.detail.checked, pas .value)
     */
    handleCriterionCheckbox(event) {
        const idx      = parseInt(event.currentTarget.dataset.idx, 10);
        const subField = event.currentTarget.dataset.subfield;
        const updated  = this.editRule.criteria.map((c, i) =>
            i === idx ? { ...c, [subField]: event.detail.checked } : c
        );
        this.editRule = { ...this.editRule, criteria: enrichCriteria(updated) };
    }

    handleRemoveCriterion(event) {
        const idx        = parseInt(event.currentTarget.dataset.idx, 10);
        const updatedCriteria = enrichCriteria(
            this.editRule.criteria.filter((_, i) => i !== idx)
        );
        this.editRule = { ...this.editRule, criteria: updatedCriteria };
    }

    handleSaveRule() {
        if (!this.editRule.name || !this.editRule.objectApiName) {
            this.dispatchEvent(new ShowToastEvent({
                title:   'Champs requis manquants',
                message: 'Veuillez renseigner le nom et l\'objet Salesforce.',
                variant: 'error'
            }));
            return;
        }
        // TODO: appeler saveRule Apex avec this.editRule
        this.dispatchEvent(new ShowToastEvent({
            title:   'Règle enregistrée',
            message: `La règle "${this.editRule.name}" a été enregistrée.`,
            variant: 'success'
        }));
        this.showModal = false;
    }
}