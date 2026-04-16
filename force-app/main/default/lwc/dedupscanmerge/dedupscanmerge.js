import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import getDuplicateGroups from '@salesforce/apex/DedupScanController.getDuplicateGroups';
// import mergeGroup from '@salesforce/apex/DedupScanController.mergeGroup';
// import ignoreGroup from '@salesforce/apex/DedupScanController.ignoreGroup';
// import launchScan from '@salesforce/apex/DedupScanController.launchScan';

const OBJ_COLORS = {
    Lead:    'background:#f88962;color:#ffffff',
    Contact: 'background:#a094ed;color:#ffffff',
    Account: 'background:#57b5e5;color:#ffffff'
};

export default class DedupScanMerge extends LightningElement {

    @track duplicateGroups = [
        {
            id: 'g1', objectApiName: 'Lead', objectLabel: 'Lead',
            masterId: '00Q5g000003abcDEAQ', masterName: 'Marie Dupont',
            duplicateNames: ['M. Dupont', 'Marie DUPONT'],
            ruleName: 'Email exact match', confidence: 98, confidenceLabel: '98%',
            diffFields: 2, diffFieldsLabel: '2 champs',
            status: 'PENDING', statusLabel: 'En attente', statusClass: 'badge-warning',
            selected: false
        },
        {
            id: 'g2', objectApiName: 'Contact', objectLabel: 'Contact',
            masterId: '0035g000004xyzABCD', masterName: 'Jean-Pierre Martin',
            duplicateNames: ['JP Martin'],
            ruleName: 'Nom fuzzy + Téléphone', confidence: 82, confidenceLabel: '82%',
            diffFields: 4, diffFieldsLabel: '4 champs',
            status: 'PENDING', statusLabel: 'En attente', statusClass: 'badge-warning',
            selected: false
        },
        {
            id: 'g3', objectApiName: 'Account', objectLabel: 'Account',
            masterId: '0015g000001rstUVWX', masterName: 'Acme Corp SAS',
            duplicateNames: ['ACME Corp', 'Acme Corporation'],
            ruleName: 'Nom + Adresse', confidence: 74, confidenceLabel: '74%',
            diffFields: 6, diffFieldsLabel: '6 champs',
            status: 'REVIEW', statusLabel: 'Révision', statusClass: 'badge-info',
            selected: false
        },
        {
            id: 'g4', objectApiName: 'Lead', objectLabel: 'Lead',
            masterId: '00Q5g000003efgHIJK', masterName: 'Sophie Bernard',
            duplicateNames: ['Sophie BERNARD'],
            ruleName: 'Email exact match', confidence: 100, confidenceLabel: '100%',
            diffFields: 0, diffFieldsLabel: '0 champ',
            status: 'AUTO_MERGED', statusLabel: 'Fusionné auto', statusClass: 'badge-success',
            selected: false
        },
        {
            id: 'g5', objectApiName: 'Contact', objectLabel: 'Contact',
            masterId: '0035g000004lmnOPQR', masterName: 'Alain Moreau',
            duplicateNames: ['A. Moreau', 'Alain MOREAU'],
            ruleName: 'Nom fuzzy + Téléphone', confidence: 61, confidenceLabel: '61%',
            diffFields: 7, diffFieldsLabel: '7 champs',
            status: 'IGNORED', statusLabel: 'Ignoré', statusClass: 'badge-neutral',
            selected: false
        }
    ];

    @track filterObject = '';
    @track filterRule = '';
    @track filterStatus = '';
    @track filterConfidence = 50;
    @track currentPage = 1;
    @track pageSize = 20;

    @track showScanModal = false;
    @track showPreviewModal = false;
    @track previewGroup = null;

    @track scanConfig = {
        objectApiName: 'Lead',
        ruleId: 'r1',
        scope: 'ALL',
        recordLimit: 0,
        autoMergeExact: true,
        sendReport: false
    };

    @track activeScan = null;

    // -- Computed --

    get hasScanRunning() {
        return this.activeScan !== null;
    }

    get totalDuplicates() {
        return this.duplicateGroups.filter(g => g.status !== 'IGNORED' && g.status !== 'AUTO_MERGED').length;
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
            })
            .map(g => ({
                ...g,
                objPillStyle: OBJ_COLORS[g.objectApiName] || 'background:#888;color:#fff',
                confidenceStyle: `width:${g.confidence}%;background:${g.confidence >= 90 ? '#2e844a' : g.confidence >= 70 ? '#ff9e2c' : '#ba0517'}`,
                confidenceTextStyle: `color:${g.confidence >= 90 ? '#2e844a' : g.confidence >= 70 ? '#b75000' : '#ba0517'}`,
                rowClass: g.selected ? 'slds-is-selected' : ''
            }));
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.filteredGroups.length / this.pageSize));
    }

    get paginationStart() {
        return Math.min((this.currentPage - 1) * this.pageSize + 1, this.filteredGroups.length);
    }

    get paginationEnd() {
        return Math.min(this.currentPage * this.pageSize, this.filteredGroups.length);
    }

    get isPrevDisabled() { return this.currentPage <= 1; }
    get isNextDisabled() { return this.currentPage >= this.totalPages; }

    // -- Options --

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

    ruleOptions = [
        { label: 'Lead — Email exact match', value: 'r1' },
        { label: 'Contact — Nom fuzzy + Téléphone', value: 'r2' },
        { label: 'Account — Nom + Adresse', value: 'r3' }
    ];

    ruleFilterOptions = [
        { label: 'Toutes les règles', value: '' },
        { label: 'Email exact match', value: 'Email exact match' },
        { label: 'Nom fuzzy + Téléphone', value: 'Nom fuzzy + Téléphone' },
        { label: 'Nom + Adresse', value: 'Nom + Adresse' }
    ];

    statusFilterOptions = [
        { label: 'Tous les statuts', value: '' },
        { label: 'En attente', value: 'PENDING' },
        { label: 'Révision', value: 'REVIEW' },
        { label: 'Fusionné auto', value: 'AUTO_MERGED' },
        { label: 'Ignoré', value: 'IGNORED' }
    ];

    scopeOptions = [
        { label: 'Tous les enregistrements', value: 'ALL' },
        { label: 'Créés cette semaine', value: 'THIS_WEEK' },
        { label: 'Créés ce mois', value: 'THIS_MONTH' },
        { label: 'Non encore scannés', value: 'UNSCANNED' }
    ];

    // -- Handlers --

    handleObjectFilter(e) { this.filterObject = e.detail.value; }
    handleRuleFilter(e)   { this.filterRule   = e.detail.value; }
    handleStatusFilter(e) { this.filterStatus = e.detail.value; }
    handleConfidenceFilter(e) { this.filterConfidence = parseInt(e.detail.value, 10); }

    handleSelectAll()    { this._setAllSelected(true); }
    handleDeselectAll()  { this._setAllSelected(false); }

    handleSelectAllToggle(e) { this._setAllSelected(e.target.checked); }

    _setAllSelected(val) {
        this.duplicateGroups = this.duplicateGroups.map(g => ({ ...g, selected: val }));
    }

    handleRowSelect(event) {
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
        this.scanConfig = { ...this.scanConfig, [field]: val };
    }

    handleLaunchScan() {
        this.showScanModal = false;
        this.activeScan = {
            name: `Scan ${this.scanConfig.objectApiName}`,
            processed: 0,
            total: 48230,
            progress: 0,
            progressLabel: '0%'
        };
        // Simulate progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 8) + 2;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                this.activeScan = null;
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Scan terminé',
                    message: 'Le scan a été effectué avec succès. Les résultats sont disponibles.',
                    variant: 'success'
                }));
            } else {
                this.activeScan = {
                    ...this.activeScan,
                    processed: Math.floor(progress * 482),
                    progress,
                    progressLabel: `${progress}%`
                };
            }
        }, 600);
        // TODO: remplacer par appel Apex launchScan() + polling
    }

    handleCancelScan() {
        this.activeScan = null;
        this.dispatchEvent(new ShowToastEvent({
            title: 'Scan annulé',
            message: 'Le scan a été interrompu.',
            variant: 'warning'
        }));
    }

    handlePreview(event) {
        const groupId = event.currentTarget.dataset.groupId;
        const group = this.duplicateGroups.find(g => g.id === groupId);
        if (!group) return;
        this.previewGroup = {
            ...group,
            fieldComparison: [
                { id: 'f1', label: 'Prénom', masterValue: 'Marie', dupeValue: 'M.', selectedValue: 'Marie', masterClass: 'preview-cell preview-cell--selected', dupeClass: 'preview-cell' },
                { id: 'f2', label: 'Nom', masterValue: 'Dupont', dupeValue: 'DUPONT', selectedValue: 'Dupont', masterClass: 'preview-cell preview-cell--selected', dupeClass: 'preview-cell' },
                { id: 'f3', label: 'Email', masterValue: 'marie.dupont@email.com', dupeValue: 'marie.dupont@email.com', selectedValue: 'marie.dupont@email.com', masterClass: 'preview-cell preview-cell--selected', dupeClass: 'preview-cell' },
                { id: 'f4', label: 'Téléphone', masterValue: '+33 6 12 34 56 78', dupeValue: '', selectedValue: '+33 6 12 34 56 78', masterClass: 'preview-cell preview-cell--selected', dupeClass: 'preview-cell preview-cell--empty' },
                { id: 'f5', label: 'Entreprise', masterValue: 'Acme Corp', dupeValue: 'ACME', selectedValue: 'Acme Corp', masterClass: 'preview-cell preview-cell--selected', dupeClass: 'preview-cell' }
            ]
        };
        this.showPreviewModal = true;
    }

    handleSelectMasterValue(event) { this._togglePreviewSelection(event, 'master'); }
    handleSelectDupeValue(event)   { this._togglePreviewSelection(event, 'dupe'); }

    _togglePreviewSelection(event, source) {
        const fieldId = event.currentTarget.dataset.field;
        this.previewGroup = {
            ...this.previewGroup,
            fieldComparison: this.previewGroup.fieldComparison.map(f => {
                if (f.id !== fieldId) return f;
                const val = source === 'master' ? f.masterValue : f.dupeValue;
                return {
                    ...f,
                    selectedValue: val,
                    masterClass: `preview-cell${source === 'master' ? ' preview-cell--selected' : ''}`,
                    dupeClass:   `preview-cell${source === 'dupe'   ? ' preview-cell--selected' : ''}`
                };
            })
        };
    }

    handleClosePreview() { this.showPreviewModal = false; this.previewGroup = null; }

    handleConfirmMerge() {
        const groupId = this.previewGroup?.id;
        this._markGroupMerged(groupId);
        this.showPreviewModal = false;
        this.previewGroup = null;
        this.dispatchEvent(new ShowToastEvent({ title: 'Fusion réussie', message: 'L\'enregistrement a été fusionné avec succès.', variant: 'success' }));
    }

    handleMergeOne(event) {
        const groupId = event.currentTarget.dataset.groupId;
        this._markGroupMerged(groupId);
        this.dispatchEvent(new ShowToastEvent({ title: 'Fusion réussie', message: 'Doublon fusionné.', variant: 'success' }));
    }

    handleMergeSelected() {
        const count = this.selectedCount;
        this.duplicateGroups = this.duplicateGroups.map(g =>
            g.selected ? { ...g, status: 'AUTO_MERGED', statusLabel: 'Fusionné', statusClass: 'badge-success', selected: false } : g
        );
        this.dispatchEvent(new ShowToastEvent({ title: `${count} fusions effectuées`, message: 'Les enregistrements sélectionnés ont été fusionnés.', variant: 'success' }));
    }

    handleIgnore(event) {
        const groupId = event.currentTarget.dataset.groupId;
        this.duplicateGroups = this.duplicateGroups.map(g =>
            g.id === groupId ? { ...g, status: 'IGNORED', statusLabel: 'Ignoré', statusClass: 'badge-neutral' } : g
        );
    }

    handleIgnoreFromPreview() {
        this.handleIgnore({ currentTarget: { dataset: { groupId: this.previewGroup.id } } });
        this.showPreviewModal = false;
        this.previewGroup = null;
    }

    _markGroupMerged(groupId) {
        this.duplicateGroups = this.duplicateGroups.map(g =>
            g.id === groupId ? { ...g, status: 'AUTO_MERGED', statusLabel: 'Fusionné', statusClass: 'badge-success' } : g
        );
    }

    handleExport() {
        this.dispatchEvent(new ShowToastEvent({ title: 'Export', message: 'Export CSV en cours de préparation...', variant: 'info' }));
    }

    handlePrevPage() { if (this.currentPage > 1) this.currentPage--; }
    handleNextPage() { if (this.currentPage < this.totalPages) this.currentPage++; }
    get groupesLabel() {
    return this.filteredGroups.length + ' groupes';
}
}