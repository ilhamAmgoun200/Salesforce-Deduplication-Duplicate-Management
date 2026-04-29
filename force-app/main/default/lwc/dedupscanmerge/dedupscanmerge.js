import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const OBJ_COLORS = {
    Lead:    'background:#f88962;color:#ffffff',
    Contact: 'background:#a094ed;color:#ffffff',
    Account: 'background:#57b5e5;color:#ffffff'
};

export default class DedupScanMerge extends LightningElement {

    // ========== Données ==========
    
    @track duplicateGroups = [
        {
            id: 'g1', objectApiName: 'Lead', objectLabel: 'Lead',
            ruleName: 'Email exact match', confidence: 98, confidenceLabel: '98%',
            status: 'PENDING', statusLabel: 'En attente', statusClass: 'badge-warning',
            selected: false,
            records: [
                { id: 'r1', name: 'Marie Dupont', isMaster: true, fields: [{ id: 'f1', label: 'Email', value: 'marie@email.com' }, { id: 'f2', label: 'Téléphone', value: '0612345678' }] },
                { id: 'r2', name: 'M. Dupont', isMaster: false, fields: [{ id: 'f1', label: 'Email', value: 'm.dupont@email.com' }, { id: 'f2', label: 'Téléphone', value: '0612345678' }] },
                { id: 'r3', name: 'Marie DUPONT', isMaster: false, fields: [{ id: 'f1', label: 'Email', value: 'marie.dupont@email.com' }, { id: 'f2', label: 'Téléphone', value: '' }] }
            ]
        },
        {
            id: 'g2', objectApiName: 'Contact', objectLabel: 'Contact',
            ruleName: 'Nom fuzzy + Téléphone', confidence: 82, confidenceLabel: '82%',
            status: 'PENDING', statusLabel: 'En attente', statusClass: 'badge-warning',
            selected: false,
            records: [
                { id: 'r4', name: 'Jean-Pierre Martin', isMaster: true, fields: [{ id: 'f1', label: 'Email', value: 'jp.martin@email.com' }, { id: 'f2', label: 'Téléphone', value: '0698765432' }] },
                { id: 'r5', name: 'JP Martin', isMaster: false, fields: [{ id: 'f1', label: 'Email', value: 'jeanpierre@email.com' }, { id: 'f2', label: 'Téléphone', value: '0698765432' }] }
            ]
        },
        {
            id: 'g3', objectApiName: 'Account', objectLabel: 'Account',
            ruleName: 'Nom + Adresse', confidence: 74, confidenceLabel: '74%',
            status: 'REVIEW', statusLabel: 'Révision', statusClass: 'badge-info',
            selected: false,
            records: [
                { id: 'r6', name: 'Acme Corp SAS', isMaster: true, fields: [{ id: 'f1', label: 'Site Web', value: 'acme.com' }, { id: 'f2', label: 'Téléphone', value: '0145678910' }] },
                { id: 'r7', name: 'ACME Corp', isMaster: false, fields: [{ id: 'f1', label: 'Site Web', value: 'acme-corp.com' }, { id: 'f2', label: 'Téléphone', value: '0145678910' }] }
            ]
        }
    ];

    @track filterObject = '';
    @track filterRule = '';
    @track filterStatus = '';
    @track filterConfidence = 50;
    @track currentPage = 1;
    @track pageSize = 10;

    @track showScanModal = false;
    @track showPreviewModal = false;
    @track previewGroup = null;

    @track activeScans = [];

    @track scanConfig = {
        objectApiName: 'Lead',
        selectedRules: [],
        scope: 'ALL',
        recordLimit: 0,
        executionMode: 'IMMEDIATE',
        scheduledDateTime: '',
        recurrence: 'NONE',
        recurrenceInterval: 1,
        recurrenceEnd: 'NEVER',
        autoMergeExact: true,
        sendReport: false
    };

    
    // ========== Options ==========

    objectFilterOptions = [
        { label: 'Tous les objets', value: '' },
        { label: 'Lead', value: 'Lead' },
        { label: 'Contact', value: 'Contact' },
        { label: 'Account', value: 'Account' }
    ];

    objectScanOptions = [
        { label: 'Lead', value: 'Lead' },
        { label: 'Contact', value: 'Contact' },
        { label: 'Account', value: 'Account' }
    ];

    matchingRuleOptions = [
        { label: 'Email exact match', value: 'rule1' },
        { label: 'Nom fuzzy + Téléphone', value: 'rule2' },
        { label: 'Nom + Adresse', value: 'rule3' },
        { label: 'Téléphone exact', value: 'rule4' }
    ];

    ruleFilterOptions = [
        { label: 'Toutes les règles', value: '' },
        { label: 'Email exact match', value: 'Email exact match' },
        { label: 'Nom fuzzy + Téléphone', value: 'Nom fuzzy + Téléphone' },
        { label: 'Nom + Adresse', value: 'Nom + Adresse' },
        { label: 'Téléphone exact', value: 'Téléphone exact' }
    ];

    statusFilterOptions = [
        { label: 'Tous les statuts', value: '' },
        { label: 'En attente', value: 'PENDING' },
        { label: 'Révision', value: 'REVIEW' },
        { label: 'Fusionné', value: 'MERGED' },
        { label: 'Ignoré', value: 'IGNORED' }
    ];

    scopeOptions = [
        { label: 'Tous les enregistrements', value: 'ALL' },
        { label: 'Créés cette semaine', value: 'THIS_WEEK' },
        { label: 'Créés ce mois', value: 'THIS_MONTH' },
        { label: 'Non encore scannés', value: 'UNSCANNED' }
    ];

    executionModeOptions = [
        { label: 'Immédiat', value: 'IMMEDIATE' },
        { label: 'Planifier (une fois)', value: 'SCHEDULED' },
        { label: 'Périodique', value: 'RECURRING' }
    ];

    recurrenceOptions = [
        { label: 'Quotidien', value: 'DAILY' },
        { label: 'Hebdomadaire', value: 'WEEKLY' },
        { label: 'Mensuel', value: 'MONTHLY' },
        { label: 'Personnalisé', value: 'CUSTOM' }
    ];

    recurrenceEndOptions = [
        { label: 'Jamais', value: 'NEVER' },
        { label: 'Après un certain nombre', value: 'AFTER_COUNT' },
        { label: 'À une date', value: 'UNTIL_DATE' }
    ];

    // ========== Getters ==========

    get matchingRuleOptionsWithCheck() {
    const selectedRules = this.scanConfig.selectedRules || [];
    return this.matchingRuleOptions.map(rule => ({
        ...rule,
        checked: selectedRules.includes(rule.value)
    }));
}

    get hasActiveScans() {
        console.log('hasActiveScans:', this.activeScans.length > 0, this.activeScans);
        return this.activeScans.length > 0;
    }

    get totalDuplicates() {
        return this.duplicateGroups.filter(g => g.status !== 'IGNORED' && g.status !== 'MERGED').length;
    }

    get selectedCount() {
        return this.duplicateGroups.filter(g => g.selected).length;
    }

    get isMergeDisabled() {
        return this.selectedCount === 0;
    }

    get allSelected() {
        return this.filteredGroups.length > 0 && this.filteredGroups.every(g => g.selected);
    }

    get filteredGroups() {
        return this.duplicateGroups
            .filter(g => {
                const matchObj    = !this.filterObject || g.objectApiName === this.filterObject;
                const matchRule   = !this.filterRule   || g.ruleName.toLowerCase().includes(this.filterRule.toLowerCase());
                const matchStatus = !this.filterStatus || g.status === this.filterStatus;
                const matchConf   = g.confidence >= this.filterConfidence;
                return matchObj && matchRule && matchStatus && matchConf;
            });
    }

    get filteredGroupsCount() {
        return this.filteredGroups.length;
    }

    get isFilteredGroupsEmpty() {
        return this.filteredGroupsCount === 0;
    }

    get paginatedGroups() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredGroups.slice(start, end).map(g => ({
            ...g,
            objPillStyle: OBJ_COLORS[g.objectApiName] || 'background:#888;color:#fff',
            confidenceStyle: `width:${g.confidence}%;background:${g.confidence >= 90 ? '#2e844a' : g.confidence >= 70 ? '#ff9e2c' : '#ba0517'}`,
            confidenceTextStyle: `color:${g.confidence >= 90 ? '#2e844a' : g.confidence >= 70 ? '#b75000' : '#ba0517'}`,
            rowClass: g.selected ? 'slds-is-selected' : ''
        }));
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.filteredGroupsCount / this.pageSize));
    }

    get paginationStart() {
        if (this.filteredGroupsCount === 0) return 0;
        return Math.min((this.currentPage - 1) * this.pageSize + 1, this.filteredGroupsCount);
    }

    get paginationEnd() {
        return Math.min(this.currentPage * this.pageSize, this.filteredGroupsCount);
    }

    get isPrevDisabled() { return this.currentPage <= 1; }
    get isNextDisabled() { return this.currentPage >= this.totalPages; }

    get groupesLabel() {
        return this.filteredGroupsCount + ' groupes';
    }

    get showScheduleOptions() {
        return this.scanConfig.executionMode !== 'IMMEDIATE';
    }

    get showRecurrenceOptions() {
        return this.scanConfig.executionMode === 'RECURRING';
    }

    get showCustomRecurrence() {
        return this.scanConfig.recurrence === 'CUSTOM';
    }

    get scanButtonLabel() {
        switch (this.scanConfig.executionMode) {
            case 'IMMEDIATE': return 'Lancer le scan';
            case 'SCHEDULED': return 'Planifier';
            case 'RECURRING': return 'Planifier la répétition';
            default: return 'Lancer le scan';
        }
    }

    // ========== Handlers ==========

    handleObjectFilter(e) { this.filterObject = e.detail.value; this.currentPage = 1; }
    handleRuleFilter(e)   { this.filterRule = e.detail.value; this.currentPage = 1; }
    handleStatusFilter(e) { this.filterStatus = e.detail.value; this.currentPage = 1; }
    handleConfidenceFilter(e) { this.filterConfidence = parseInt(e.detail.value, 10); this.currentPage = 1; }

    handleSelectAll()    { this._setAllSelected(true); }
    handleDeselectAll()  { this._setAllSelected(false); }

    handleSelectAllToggle(e) { 
        e.stopPropagation();
        this._setAllSelected(e.target.checked); 
    }

    _setAllSelected(val) {
        this.duplicateGroups = this.duplicateGroups.map(g => ({ ...g, selected: val }));
    }

    handleRowClick(event) {
        const groupId = event.currentTarget.dataset.groupId;
        if (groupId) {
            this._openPreviewForGroup(groupId);
        }
    }

    handleCheckboxClick(event) {
        event.stopPropagation();
    }

    handleRowSelect(event) {
        event.stopPropagation();
        const groupId = event.currentTarget.dataset.groupId;
        this.duplicateGroups = this.duplicateGroups.map(g =>
            g.id === groupId ? { ...g, selected: event.target.checked } : g
        );
    }

    handleOpenScanModal()  { this.showScanModal = true; }
    handleCloseScanModal() { this.showScanModal = false; }

    handleScanConfigChange(event) {
        const field = event.currentTarget.dataset.field;
        const val = event.detail.checked !== undefined ? event.detail.checked : event.detail.value;

        // Pour le dual-listbox, la valeur est déjà un tableau
    if (field === 'selectedRules') {
        val = event.detail.value;  // déjà un tableau
    }
    

        this.scanConfig = { ...this.scanConfig, [field]: val };
    }

    handleExecutionModeChange(event) {
        this.scanConfig = { 
            ...this.scanConfig, 
            executionMode: event.detail.value,
            scheduledDateTime: '',
            recurrence: 'NONE'
        };
    }



    handleLaunchScan() {
        const config = this.scanConfig;
        const now = new Date();
        const scanId = 'scan_' + now.getTime();
         
        let scanName = `Scan ${config.objectApiName}`;
        if (config.selectedRules && config.selectedRules.length > 0) {
            const ruleNames = config.selectedRules.map(r => {
                const found = this.matchingRuleOptions.find(opt => opt.value === r);
                return found ? found.label : r;
            });
            scanName += ` (${ruleNames.join(', ')})`;
        }
        
        const newScan = {
            id: scanId,
            name: scanName,
            processed: 0,
            total: Math.floor(Math.random() * 50000) + 10000,
            progress: 0,
            progressLabel: '0%',
            rulesLabel: config.selectedRules.length > 0 ? config.selectedRules.length + ' règle(s)' : 'Toutes les règles'
        };
        
        this.activeScans = [...this.activeScans, newScan];
        this.showScanModal = false;
        
        // Ajouter aux scans actifs
    this.activeScans = [...this.activeScans, newScan];
    this.showScanModal = false;

        // Simuler la progression du scan
        this._simulateScanProgress(scanId);
        
        const modeLabel = config.executionMode === 'IMMEDIATE' ? 'démarré' : 'planifié';
        this.dispatchEvent(new ShowToastEvent({
            title: 'Scan ' + modeLabel,
            message: `Le scan de ${config.objectApiName} a été ${modeLabel}.`,
            variant: 'success'
        }));
    }

    _simulateScanProgress(scanId) {
        let progress = 0;
        const interval = setInterval(() => {
            const scanIndex = this.activeScans.findIndex(s => s.id === scanId);
            if (scanIndex === -1) {
                clearInterval(interval);
                return;
            }
            
            progress += Math.floor(Math.random() * 8) + 2;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                this.activeScans = this.activeScans.filter(s => s.id !== scanId);
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Scan terminé',
                    message: 'Le scan a été effectué avec succès. Les résultats sont disponibles.',
                    variant: 'success'
                }));
                this._refreshGroupsAfterScan();
            } else {
                const updatedScan = {
                    ...this.activeScans[scanIndex],
                    processed: Math.floor(progress * (this.activeScans[scanIndex].total / 100)),
                    progress,
                    progressLabel: `${progress}%`
                };
                this.activeScans = [
                    ...this.activeScans.slice(0, scanIndex),
                    updatedScan,
                    ...this.activeScans.slice(scanIndex + 1)
                ];
            }
        }, 600);
    }

    _refreshGroupsAfterScan() {
        // Simulation de nouveaux groupes après scan
        this.dispatchEvent(new ShowToastEvent({
            title: 'Nouveaux doublons',
            message: 'De nouveaux groupes de doublons ont été détectés.',
            variant: 'info'
        }));
    }

    handleCancelScan(event) {
        const scanId = event.currentTarget.dataset.scanId;
        this.activeScans = this.activeScans.filter(s => s.id !== scanId);
        this.dispatchEvent(new ShowToastEvent({
            title: 'Scan annulé',
            message: 'Le scan a été interrompu.',
            variant: 'warning'
        }));
    }

    _openPreviewForGroup(groupId) {
        const group = this.duplicateGroups.find(g => g.id === groupId);
        if (!group) return;
        this.previewGroup = group;
        this.showPreviewModal = true;
    }

    handlePreview(event) {
        event.stopPropagation();
        const groupId = event.currentTarget.dataset.groupId;
        this._openPreviewForGroup(groupId);
    }

    handleClosePreview() { this.showPreviewModal = false; this.previewGroup = null; }

    handleConfirmMerge() {
        const groupId = this.previewGroup?.id;
        this._markGroupMerged(groupId);
        this.showPreviewModal = false;
        this.previewGroup = null;
        this.dispatchEvent(new ShowToastEvent({ 
            title: 'Fusion réussie', 
            message: 'Le groupe de doublons a été fusionné avec succès.', 
            variant: 'success' 
        }));
    }

    handleMergeOne(event) {
        event.stopPropagation();
        const groupId = event.currentTarget.dataset.groupId;
        this._markGroupMerged(groupId);
        this.dispatchEvent(new ShowToastEvent({ 
            title: 'Fusion réussie', 
            message: 'Doublon fusionné.', 
            variant: 'success' 
        }));
    }

    handleMergeSelected() {
        const count = this.selectedCount;
        this.duplicateGroups = this.duplicateGroups.map(g =>
            g.selected ? { ...g, status: 'MERGED', statusLabel: 'Fusionné', statusClass: 'badge-success', selected: false } : g
        );
        this.dispatchEvent(new ShowToastEvent({ 
            title: `${count} fusion(s) effectuée(s)`, 
            message: 'Les enregistrements sélectionnés ont été fusionnés.', 
            variant: 'success' 
        }));
    }

    handleIgnore(event) {
        event.stopPropagation();
        const groupId = event.currentTarget.dataset.groupId;
        this.duplicateGroups = this.duplicateGroups.map(g =>
            g.id === groupId ? { ...g, status: 'IGNORED', statusLabel: 'Ignoré', statusClass: 'badge-neutral' } : g
        );
    }

    handleIgnoreFromPreview() {
        this.handleIgnore({ currentTarget: { dataset: { groupId: this.previewGroup.id } }, stopPropagation: () => {} });
        this.showPreviewModal = false;
        this.previewGroup = null;
    }

    _markGroupMerged(groupId) {
        this.duplicateGroups = this.duplicateGroups.map(g =>
            g.id === groupId ? { ...g, status: 'MERGED', statusLabel: 'Fusionné', statusClass: 'badge-success' } : g
        );
    }

    handleExport() {
        this.dispatchEvent(new ShowToastEvent({ 
            title: 'Export', 
            message: 'Export CSV en cours de préparation...', 
            variant: 'info' 
        }));
    }

    handlePrevPage() { if (this.currentPage > 1) this.currentPage--; }
    handleNextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }


    // Vérifier si une règle est sélectionnée
isRuleSelected(ruleValue) {
    const selected = this.scanConfig.selectedRules || [];
    return selected.includes(ruleValue);
}

// Gérer la sélection/déselection
handleRuleSelection(event) {
    const ruleValue = event.currentTarget.dataset.ruleValue;
    let selectedRules = [...(this.scanConfig.selectedRules || [])];
    
    if (event.target.checked) {
        if (!selectedRules.includes(ruleValue)) {
            selectedRules.push(ruleValue);
        }
    } else {
        selectedRules = selectedRules.filter(r => r !== ruleValue);
    }
    
    this.scanConfig = { ...this.scanConfig, selectedRules: selectedRules };
}

}