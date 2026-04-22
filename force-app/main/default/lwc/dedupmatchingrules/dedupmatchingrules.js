import { LightningElement, track, wire } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';

import listRules           from '@salesforce/apex/MatchingRuleController.listRules';
import saveFullRule        from '@salesforce/apex/MatchingRuleController.saveFullRule';
import deleteRule          from '@salesforce/apex/MatchingRuleController.deleteRule';
import toggleActive        from '@salesforce/apex/MatchingRuleController.toggleActive';
import getFullRule         from '@salesforce/apex/MatchingRuleController.getFullRule';
import getAvailableObjects from '@salesforce/apex/MatchingRuleController.getAvailableObjects';
import getObjectFields     from '@salesforce/apex/MatchingRuleController.getObjectFields';

// ─── Constantes ───────────────────────────────────────────────────────────────

const OBJECT_BADGE_COLORS = {
    Lead:    'background:#f88962;color:#ffffff',
    Contact: 'background:#a094ed;color:#ffffff',
    Account: 'background:#57b5e5;color:#ffffff',
    default: 'background:#5a7fff;color:#ffffff'
};

const MATCHING_METHOD_OPTIONS = [
    { label: 'Exact',               value: 'Exact'    },
    { label: 'Fuzzy (Levenshtein)', value: 'Fuzzy'    },
    { label: 'Phonétique',          value: 'Phonetic' }
];

const AUTO_ACTION_OPTIONS = [
    { label: 'Aucune action',             value: 'None'          },
    { label: 'Fusionner automatiquement', value: 'AutoMerge'     },
    { label: 'Marquer pour révision',     value: 'FlagForReview' }
];

const FILTER_LOGIC_MODE_OPTIONS = [
    { label: 'ET entre tous les critères (AND)', value: 'AND'    },
    { label: 'OU entre tous les critères (OR)',  value: 'OR'     },
    { label: 'Logique personnalisée',            value: 'CUSTOM' }
];

const DEFAULT_RULE_EDIT = {
    Id:              null,
    MasterLabel__c:  '',
    DeveloperName__c:'',
    Description__c:  '',
    SobjectType__c:  '',
    IsActive__c:     true,
    BooleanFilter__c:'',
    autoAction:      'None',
    filterLogicMode: 'AND'
};

const DEFAULT_CRITERION = {
    id:                  null,
    Field__c:            '',
    MatchingMethod__c:   'Exact',
    Weight__c:           50,
    SortOrder__c:        1,
    MatchBlankFields__c: false
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function enrichCriteria(criteria) {
    return criteria.map((c, idx) => ({
        ...c,
        SortOrder__c:     idx + 1,
        orderNumber:      idx + 1,
        isFirst:          idx === 0,
        showAndSeparator: idx > 0,
        separatorKey:     `sep_${idx}`
    }));
}

function weightLabel(weight) {
    return weight != null ? weight + ' pts' : '—';
}

function detectLogicMode(booleanFilter) {
    const bf = (booleanFilter || '').trim();
    if (!bf) return 'AND';
    // OR simple sans parenthèses ni AND : "1 OR 2 OR 3"
    if (bf.toUpperCase().includes('OR') && !bf.toUpperCase().includes('AND') && !bf.includes('(')) return 'OR';
    return 'CUSTOM';
}

function mapRuleToDisplay(wrapper) {
    const rule     = wrapper.rule;
    const items    = wrapper.items || [];
    const isActive = rule.IsActive__c;
    const apiName  = rule.SobjectType__c || '';
    
    // 🔥 Utiliser objectLabel du wrapper
    const objectLabel = wrapper.objectLabel || apiName;

    return {
        id:              rule.Id,
        sfRecord:        rule,
        name:            rule.MasterLabel__c || rule.DeveloperName__c,
        developerName:   rule.DeveloperName__c,
        description:     rule.Description__c,
        objectApiName:   apiName,
        objectLabel:     objectLabel,  // ← Vrai label du backend
        objBadgeStyle:   OBJECT_BADGE_COLORS[apiName] || OBJECT_BADGE_COLORS.default,
        isActive:        isActive,
        statusLabel:     isActive ? 'Active' : 'Inactive',
        statusClass:     isActive ? 'badge-success' : 'badge-neutral',
        toggleIcon:      isActive ? 'utility:pause' : 'utility:play',
        toggleTitle:     isActive ? 'Désactiver' : 'Activer',
        filterLogic:     rule.BooleanFilter__c || '',
        confidenceLabel: '—',
        matchesFound:    '—',
        mergedCount:     '—',
        lastRunLabel:    '—',
        criteria: enrichCriteria(items.map(item => ({
            id:                  item.Id,
            Field__c:            item.Field__c,
            fieldLabel:          item.Field__c,
            MatchingMethod__c:   item.MatchingMethod__c,
            matchType:           item.MatchingMethod__c,
            Weight__c:           item.Weight__c,
            weightLabel:         weightLabel(item.Weight__c),
            SortOrder__c:        item.SortOrder__c,
            MatchBlankFields__c: item.MatchBlankFields__c,
            matchBlankFields:    item.MatchBlankFields__c
        })))
    };
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default class DedupMatchingRules extends LightningElement {

    @track rules        = [];
    @track filterObject = '';
    @track filterStatus = '';
    @track searchTerm   = '';
    @track showModal    = false;
    @track isEditMode   = false;
    @track isLoading    = false;
    @track viewMode     = 'card';

    @track editRule  = { ...DEFAULT_RULE_EDIT };
    @track editItems = [];

    @track salesforceObjectOptions = [];
    @track fieldOptions            = [];
    

    _wiredRulesResult;
    _objectFilterOptionsCache = [{ label: 'Tous les objets', value: '' }];

    // ── Wire ─────────────────────────────────────────────────────────────────

    @wire(listRules)
    wiredRules(result) {
        this._wiredRulesResult = result;
        const { data, error } = result;
        if (data) {
            this.rules = data.map(wrapper => mapRuleToDisplay(wrapper));
        } else if (error) {
            this._showToast('Erreur', this._extractError(error), 'error');
        }
    }

    @wire(getAvailableObjects)
wiredObjects({ data, error }) {
    if (data) {
        this.salesforceObjectOptions = data;
        
        this._objectFilterOptionsCache = [{ label: 'Tous les objets', value: '' }, ...data];
        

    } else if (error) {
        this._showToast('Erreur', 'Impossible de charger les objets Salesforce', 'error');
    }
}

    // ── Getters ──────────────────────────────────────────────────────────────

    get activeRulesCount() { return this.rules.filter(r => r.isActive).length; }

    get filteredRules() {
        return this.rules.filter(r => {
            const matchObj    = !this.filterObject || r.objectApiName === this.filterObject;
            const matchStatus = !this.filterStatus
                || (this.filterStatus === 'ACTIVE'   &&  r.isActive)
                || (this.filterStatus === 'INACTIVE' && !r.isActive);
            const matchSearch = !this.searchTerm
                || (r.name || '').toLowerCase().includes(this.searchTerm.toLowerCase());
            return matchObj && matchStatus && matchSearch;
        });
    }

    get hasRules()    { return this.filteredRules.length > 0; }
    get modalTitle()  { return this.isEditMode ? 'Modifier la règle' : 'Nouvelle règle de matching'; }

    get objectFilterOptions() { return this._objectFilterOptionsCache; }

    // Vue toggle
    get isCardView()       { return this.viewMode === 'card';  }
    get isTableView()      { return this.viewMode === 'table'; }
    get cardViewVariant()  { return this.viewMode === 'card'  ? 'brand' : 'neutral'; }
    get tableViewVariant() { return this.viewMode === 'table' ? 'brand' : 'neutral'; }

    // Logique
    get isCustomLogic()      { return this.editRule.filterLogicMode === 'CUSTOM'; }
    get logicSeparatorLabel(){ return this.editRule.filterLogicMode === 'OR' ? 'OU' : 'ET'; }

    // ── Options ───────────────────────────────────────────────────────────────

    statusFilterOptions    = [
        { label: 'Tous les statuts', value: ''         },
        { label: 'Actives',          value: 'ACTIVE'   },
        { label: 'Inactives',        value: 'INACTIVE' }
    ];
    matchTypeOptions        = MATCHING_METHOD_OPTIONS;
    autoActionOptions       = AUTO_ACTION_OPTIONS;
    filterLogicModeOptions  = FILTER_LOGIC_MODE_OPTIONS;

    // ── Handlers vue ─────────────────────────────────────────────────────────

    handleCardView()  { this.viewMode = 'card';  }
    handleTableView() { this.viewMode = 'table'; }

    // ── Handlers filtres ──────────────────────────────────────────────────────

    handleObjectFilter(event) { this.filterObject = event.detail.value; }
    handleStatusFilter(event) { this.filterStatus = event.detail.value; }
    handleSearch(event)       { this.searchTerm   = event.detail.value; }

    // ── Handlers modal ────────────────────────────────────────────────────────

    handleNewRule() {
        this.isEditMode   = false;
        this.editRule     = { ...DEFAULT_RULE_EDIT };
        // 1 critère par défaut à l'ouverture
        this.editItems    = enrichCriteria([{
            ...DEFAULT_CRITERION,
            id: `new_${Date.now()}`
        }]);
        this.fieldOptions = [];
        this.showModal    = true;
    }

    handleEditRule(event) {
        const ruleId = event.currentTarget.dataset.ruleId;
        this.isLoading = true;

        getFullRule({ ruleId })
            .then(wrapper => {
                const rule  = wrapper.rule;
                const items = wrapper.items || [];

                const bf   = rule.BooleanFilter__c || '';
                const mode = detectLogicMode(bf);

                this.editRule = {
                    Id:              rule.Id,
                    MasterLabel__c:  rule.MasterLabel__c   || '',
                    DeveloperName__c:rule.DeveloperName__c  || '',
                    Description__c:  rule.Description__c   || '',
                    SobjectType__c:  rule.SobjectType__c   || '',
                    IsActive__c:     rule.IsActive__c,
                    BooleanFilter__c:bf,
                    autoAction:      rule.AutoAction__c    || 'None',
                    filterLogicMode: mode
                };

                this.editItems = enrichCriteria(items.map(item => ({
                    id:                  item.Id,
                    Field__c:            item.Field__c,
                    MatchingMethod__c:   item.MatchingMethod__c,
                    Weight__c:           item.Weight__c,
                    SortOrder__c:        item.SortOrder__c,
                    MatchBlankFields__c: item.MatchBlankFields__c || false
                })));

                // Si pas d'items, 1 critère par défaut
                if (this.editItems.length === 0) {
                    this.editItems = enrichCriteria([{ ...DEFAULT_CRITERION, id: `new_${Date.now()}` }]);
                }

                this.isEditMode = true;
                this.showModal  = true;

                if (rule.SobjectType__c) return this._loadFieldOptions(rule.SobjectType__c);
            })
            .catch(error => { this._showToast('Erreur', this._extractError(error), 'error'); })
            .finally(() => { this.isLoading = false; });
    }

    handleCloseModal() { this.showModal = false; }

    // ── Handlers champs règle ─────────────────────────────────────────────────

    handleFieldChange(event) {
        const field = event.currentTarget.dataset.field;
        const value = event.detail.value;
        let updated = { ...this.editRule, [field]: value };

        // Quand on change le mode logique, reset BooleanFilter si pas CUSTOM
        if (field === 'filterLogicMode') {
            if (value === 'AND') updated.BooleanFilter__c = '';
            if (value === 'OR')  updated.BooleanFilter__c = '';
        }

        this.editRule = updated;

        if (field === 'SobjectType__c' && value) {
            this.fieldOptions = [];
            this._loadFieldOptions(value);
        }
    }

    // ── Handlers critères ─────────────────────────────────────────────────────

    handleAddCriterion() {
        const newItem = {
            ...DEFAULT_CRITERION,
            id:       `new_${Date.now()}`,
            Field__c: this.fieldOptions.length ? this.fieldOptions[0].value : ''
        };
        this.editItems = enrichCriteria([...this.editItems, newItem]);
    }

    handleCriterionChange(event) {
        const idx      = parseInt(event.currentTarget.dataset.idx, 10);
        const subField = event.currentTarget.dataset.subfield;
        this.editItems = enrichCriteria(
            this.editItems.map((c, i) => i === idx ? { ...c, [subField]: event.detail.value } : c)
        );
    }

    handleCriterionCheckbox(event) {
        const idx      = parseInt(event.currentTarget.dataset.idx, 10);
        const subField = event.currentTarget.dataset.subfield;
        this.editItems = enrichCriteria(
            this.editItems.map((c, i) => i === idx ? { ...c, [subField]: event.detail.checked } : c)
        );
    }

    handleRemoveCriterion(event) {
        const idx = parseInt(event.currentTarget.dataset.idx, 10);
        this.editItems = enrichCriteria(this.editItems.filter((_, i) => i !== idx));
    }

    // ── Handler toggle actif ──────────────────────────────────────────────────

    handleToggleRule(event) {
        const ruleId   = event.currentTarget.dataset.ruleId;
        const ruleData = this.rules.find(r => r.id === ruleId);
        if (!ruleData) return;

        const newActive = !ruleData.isActive;
        this.isLoading  = true;

        toggleActive({ ruleId, isActive: newActive })
            .then(() => {
                this.rules = this.rules.map(r => {
                    if (r.id !== ruleId) return r;
                    return {
                        ...r,
                        isActive:    newActive,
                        statusLabel: newActive ? 'Active' : 'Inactive',
                        statusClass: newActive ? 'badge-success' : 'badge-neutral',
                        toggleIcon:  newActive ? 'utility:pause' : 'utility:play',
                        toggleTitle: newActive ? 'Désactiver' : 'Activer'
                    };
                });
                this._showToast(
                    newActive ? 'Règle activée' : 'Règle désactivée',
                    `"${ruleData.name}" a été ${newActive ? 'activée' : 'désactivée'}.`,
                    'success'
                );
            })
            .catch(error => { this._showToast('Erreur', this._extractError(error), 'error'); })
            .finally(() => { this.isLoading = false; });
    }

    // ── Handler suppression ───────────────────────────────────────────────────

    handleDeleteRule(event) {
        const ruleId   = event.currentTarget.dataset.ruleId;
        const ruleData = this.rules.find(r => r.id === ruleId);
        if (!ruleData) return;

        // eslint-disable-next-line no-alert
        if (!confirm(`Supprimer la règle "${ruleData.name}" ?`)) return;

        this.isLoading = true;
        deleteRule({ ruleId })
            .then(() => {
                this.rules = this.rules.filter(r => r.id !== ruleId);
                this._showToast('Supprimée', 'La règle a été supprimée.', 'success');
            })
            .catch(error => { this._showToast('Erreur', this._extractError(error), 'error'); })
            .finally(() => { this.isLoading = false; });
    }

    // ── Handler sauvegarde ────────────────────────────────────────────────────

    handleSaveRule() {
        if (_isBlank(this.editRule.MasterLabel__c)) {
            return this._showToast('Champ requis', 'Le nom (MasterLabel) est requis.', 'error');
        }
        if (_isBlank(this.editRule.DeveloperName__c)) {
            return this._showToast('Champ requis', 'Le nom technique (DeveloperName) est requis.', 'error');
        }
        if (_isBlank(this.editRule.SobjectType__c)) {
            return this._showToast('Champ requis', "L'objet Salesforce est requis.", 'error');
        }
        if (!this.editItems || this.editItems.length === 0) {
            return this._showToast('Critères manquants', 'Ajoutez au moins un critère de matching.', 'error');
        }

        const itemRecords = this.editItems.map((item, idx) => ({
            Id:                  item.id && !String(item.id).startsWith('new_') ? item.id : null,
            Field__c:            item.Field__c,
            MatchingMethod__c:   item.MatchingMethod__c,
            Weight__c:           item.Weight__c,
            SortOrder__c:        idx + 1,
            MatchBlankFields__c: item.MatchBlankFields__c || false
        }));

         // ✅ AJOUTE ICI LE CONSOLE.LOG
         console.log('ITEMS AVANT ENVOI:', JSON.stringify(itemRecords));


        // Calculer BooleanFilter__c selon le mode
        let boolFilter = this.editRule.BooleanFilter__c || '';
        if (this.editRule.filterLogicMode === 'AND') {
            boolFilter = '';
        } else if (this.editRule.filterLogicMode === 'OR') {
            boolFilter = itemRecords.map((_, i) => i + 1).join(' OR ');
        }
        // CUSTOM → boolFilter déjà saisi par l'utilisateur

        const ruleRecord = {
            Id:              this.editRule.Id || null,
            MasterLabel__c:  this.editRule.MasterLabel__c,
            DeveloperName__c:this.editRule.DeveloperName__c,
            Description__c:  this.editRule.Description__c  || '',
            SobjectType__c:  this.editRule.SobjectType__c,
            IsActive__c:     this.editRule.IsActive__c !== false,
            BooleanFilter__c:boolFilter,
            AutoAction__c:   this.editRule.autoAction || 'None'
        };

        this.isLoading = true;

        saveFullRule({ rule: ruleRecord, items: itemRecords })
            .then(() => {
                this._showToast('Enregistrée', `La règle "${ruleRecord.MasterLabel__c}" a été enregistrée.`, 'success');
                this.showModal = false;
                return refreshApex(this._wiredRulesResult);
            })
            .catch(error => { this._showToast('Erreur', this._extractError(error), 'error'); })
            .finally(() => { this.isLoading = false; });
    }

    // ── Privé ─────────────────────────────────────────────────────────────────

    _loadFieldOptions(objectName) {
        return getObjectFields({ objectName })
            .then(fields => { this.fieldOptions = fields || []; })
            .catch(() => {
                this.fieldOptions = [];
                this._showToast('Avertissement', 'Impossible de charger les champs de cet objet.', 'warning');
            });
    }

    _showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }

    _extractError(error) {
        if (error && error.body && error.body.message) return error.body.message;
        if (error && error.message) return error.message;
        return 'Une erreur inattendue est survenue.';
    }

    // method pour generer le Developer name a partir du master label
generateDeveloperName(masterLabel) {
    console.log('generateDeveloperName appelé avec:', masterLabel);

    if (!masterLabel) return '';
    
    // 1. Supprimer les accents (optionnel, selon tes besoins)
    let normalized = masterLabel.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    
    // 2. Remplacer les espaces et caractères spéciaux par des underscores
    let developerName = normalized
        .replace(/[^a-zA-Z0-9\s]/g, '')  // Enlever les caractères spéciaux
        .trim()
        .replace(/\s+/g, '_')            // Remplacer les espaces par _
        .toLowerCase();                   // Mettre en minuscules
    
    // 3. S'assurer que le nom commence par une lettre (exigence Salesforce)
    if (developerName.length > 0 && !/[a-zA-Z]/.test(developerName[0])) {
        developerName = 'rule_' + developerName;
    }
    
    // 4. Limiter la longueur (255 caractères max pour DeveloperName)
    if (developerName.length > 255) {
        developerName = developerName.substring(0, 255);
    }
    
    return developerName;
}

handleMasterLabelBlur(event) {
    // Ne générer que si c'est une nouvelle règle (pas en mode édition)
    if (!this.isEditMode) {
        const masterLabel = event.target.value;
        if (masterLabel && !this.editRule.DeveloperName__c) {
            const autoDeveloperName = this.generateDeveloperName(masterLabel);
            this.editRule = {
                ...this.editRule,
                DeveloperName__c: autoDeveloperName
            };
        }
    }
}
}

function _isBlank(s) {
    return !s || String(s).trim().length === 0;
}