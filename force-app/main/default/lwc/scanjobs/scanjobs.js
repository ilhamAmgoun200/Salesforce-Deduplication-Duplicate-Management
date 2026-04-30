import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const OBJ_COLORS = {
    Lead:    'background:#f88962;color:#ffffff',
    Contact: 'background:#a094ed;color:#ffffff',
    Account: 'background:#57b5e5;color:#ffffff',
    default: 'background:#5a7fff;color:#ffffff'
};

export default class ScanJobs extends LightningElement {
    
    // ========== Données des jobs ==========

    @track searchTerm = '';
    @track filterObject = '';

    @track jobs = [
        {
            id: 'job1',
            name: 'Scan Lead - Nettoyage trimestriel',
            objectApiName: 'Lead',
            objectLabel: 'Lead',
            scope: 'ALL',
            recordLimit: 0,
            rules: ['rule1', 'rule2'],
            rulesLabel: 'Email exact match, Nom fuzzy',
            status: 'RUNNING',
            progress: 45,
            duplicatesFound: 0,
            createdAt: new Date('2025-04-24T10:00:00'),
            scheduledDateTime: null,
            completedDate: null,
            autoMergeExact: true,
            sendReport: false
        },
        {
            id: 'job2',
            name: 'Scan Contact - Vérification hebdomadaire',
            objectApiName: 'Contact',
            objectLabel: 'Contact',
            scope: 'THIS_MONTH',
            recordLimit: 10000,
            rules: ['rule2'],
            rulesLabel: 'Nom fuzzy + Téléphone',
            status: 'SCHEDULED',
            progress: 0,
            duplicatesFound: 0,
            createdAt: new Date('2025-04-24T09:00:00'),
            scheduledDateTime: new Date('2025-04-25T08:00:00'),
            completedDate: null,
            autoMergeExact: false,
            sendReport: true,
            scheduleType: 'ONCE'
        },
        {
            id: 'job3',
            name: 'Scan Account - Fusion annuelle',
            objectApiName: 'Account',
            objectLabel: 'Account',
            scope: 'ALL',
            recordLimit: 0,
            rules: ['rule3'],
            rulesLabel: 'Nom + Adresse',
            status: 'COMPLETED',
            progress: 100,
            duplicatesFound: 12,
            createdAt: new Date('2025-04-23T14:00:00'),
            scheduledDateTime: null,
            completedDate: new Date('2025-04-23T15:30:00'),
            autoMergeExact: false,
            sendReport: true
        }
    ];
    
    @track selectedTab = 'RUNNING';
    @track showNewScanModal = false;
    @track showDuplicatesModal = false;
    @track showPreviewModal = false;
    @track showJobDetailModal = false;
    @track showEditJobModal = false;
    @track showDeleteConfirmModal = false;
    
    @track selectedJob = null;
    @track selectedJobDetail = null;
    @track editingJob = null;
    @track jobToDelete = null;
    @track duplicateGroups = [];
    @track previewGroup = null;
    
    @track currentStep = 1;
    
    @track newScanConfig = {
        objectApiName: 'Lead',
        selectedRules: [],
        scope: 'ALL',
        recordLimit: 0,
        executionMode: 'IMMEDIATE',
        scheduledDateTime: '',
        recurrence: 'DAILY',
        autoMergeExact: true,
        sendReport: false,
        emailRecipients: '',
        startDateTime: '',
        endDateTime: ''
    };
    
    @track editJobConfig = {
        scope: 'ALL',
        recordLimit: 0,
        selectedRules: []
    };
    
    @track mergeResultFields = [];
    
    // ========== Options ==========
    objectOptions = [
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
        { label: 'Mensuel', value: 'MONTHLY' }
    ];
    
    // ========== Getters - Jobs bruts ==========
    
    get runningJobs() { return this.jobs.filter(j => j.status === 'RUNNING'); }
    get pausedJobs() { return this.jobs.filter(j => j.status === 'PAUSED'); }
    get scheduledJobs() { 
        return this.jobs.filter(j => j.status === 'SCHEDULED').map(j => ({
            ...j,
            scheduledDateLabel: j.scheduledDateTime ? new Date(j.scheduledDateTime).toLocaleString() : 'À définir',
            nextRunDate: this.getNextRunDate(j),
            scheduleType: j.scheduleType || 'ONCE',
            scheduleTypeLabel: j.scheduleType === 'RECURRING' ? 'Périodique' : 'Unique'
        }));
    }
    get completedJobs() { return this.jobs.filter(j => j.status === 'COMPLETED'); }
    
    // ========== Getters - Jobs filtrés ==========
    
    get filteredRunningJobs() {
        return this.runningJobs.filter(job => {
            const matchSearch = !this.searchTerm || job.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchObject = !this.filterObject || job.objectApiName === this.filterObject;
            return matchSearch && matchObject;
        });
    }
    
    get filteredPausedJobs() {
        return this.pausedJobs.filter(job => {
            const matchSearch = !this.searchTerm || job.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchObject = !this.filterObject || job.objectApiName === this.filterObject;
            return matchSearch && matchObject;
        });
    }
    
    get filteredScheduledJobs() {
        return this.scheduledJobs.filter(job => {
            const matchSearch = !this.searchTerm || job.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchObject = !this.filterObject || job.objectApiName === this.filterObject;
            return matchSearch && matchObject;
        });
    }
    
    get filteredCompletedJobs() {
        return this.completedJobs.filter(job => {
            const matchSearch = !this.searchTerm || job.name.toLowerCase().includes(this.searchTerm.toLowerCase());
            const matchObject = !this.filterObject || job.objectApiName === this.filterObject;
            return matchSearch && matchObject;
        });
    }
    
    // ========== Getters - Affichage ==========
    
    get displayRunningJobs() { return this.filteredRunningJobs; }
    get displayPausedJobs() { return this.filteredPausedJobs; }
    get displayScheduledJobs() { return this.filteredScheduledJobs; }
    get displayCompletedJobs() { return this.filteredCompletedJobs; }
    
    // ========== Getters - Compteurs ==========
    
    get totalJobs() { return this.jobs.length; }
    get runningJobsCount() { return this.filteredRunningJobs.length; }
    get pausedJobsCount() { return this.filteredPausedJobs.length; }
    get scheduledJobsCount() { return this.filteredScheduledJobs.length; }
    get completedJobsCount() { return this.filteredCompletedJobs.length; }
    
    get hasRunningJobs() { return this.filteredRunningJobs.length > 0; }
    get hasPausedJobs() { return this.filteredPausedJobs.length > 0; }
    get hasScheduledJobs() { return this.filteredScheduledJobs.length > 0; }
    get hasCompletedJobs() { return this.filteredCompletedJobs.length > 0; }
    
    // ========== Getters - Onglets ==========
    
    get showRunning() { return this.selectedTab === 'RUNNING'; }
    get showPaused() { return this.selectedTab === 'PAUSED'; }
    get showScheduled() { return this.selectedTab === 'SCHEDULED'; }
    get showCompleted() { return this.selectedTab === 'COMPLETED'; }
    
    get runningTabClass() { return this.selectedTab === 'RUNNING' ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item'; }
    get pausedTabClass() { return this.selectedTab === 'PAUSED' ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item'; }
    get scheduledTabClass() { return this.selectedTab === 'SCHEDULED' ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item'; }
    get completedTabClass() { return this.selectedTab === 'COMPLETED' ? 'slds-tabs_default__item slds-is-active' : 'slds-tabs_default__item'; }
    
    // ========== Getters - Modale nouveau scan ==========
    
    get isStep1() { return this.currentStep === 1; }
    get isStep2() { return this.currentStep === 2; }
    get isStep3() { return this.currentStep === 3; }
    get isStep4() { return this.currentStep === 4; }
    get isLastStep() { return this.currentStep === 5; }
    get hasPreviousStep() { return this.currentStep > 1; }
    get hasNextStep() { return this.currentStep < 5; }
    
    get showScheduleDate() { return this.newScanConfig.executionMode === 'SCHEDULED'; }
    get showRecurrenceOptions() { return this.newScanConfig.executionMode === 'RECURRING'; }
    
    get finalButtonLabel() {
        const mode = this.newScanConfig.executionMode;
        if (mode === 'IMMEDIATE') return 'Lancer le scan';
        if (mode === 'SCHEDULED') return 'Planifier';
        return 'Planifier la répétition';
    }
    
    get selectedJobName() { return this.selectedJob?.name || ''; }
    get previewGroupName() { return this.previewGroup?.masterName || ''; }
    get isRunningJobDetail() { return this.selectedJobDetail?.status === 'RUNNING'; }
    get isScheduledJobDetail() { return this.selectedJobDetail?.status === 'SCHEDULED'; }
    
    get previewGroupRecords() {
        return this.previewGroup?.records || [];
    }
    
    // ========== Getters - Options ==========
    
    get objectFilterOptions() {
        const uniqueObjects = [...new Set(this.jobs.map(job => job.objectApiName))];
        return [
            { label: 'Tous les objets', value: '' },
            ...uniqueObjects.map(obj => ({ label: obj, value: obj }))
        ];
    }
    
    get matchingRuleOptionsWithCheck() {
        const selectedRules = this.newScanConfig.selectedRules;
        return this.matchingRuleOptions.map(rule => ({
            ...rule,
            checked: selectedRules.includes(rule.value)
        }));
    }
    
    get editRulesOptions() {
        const selectedRules = this.editJobConfig.selectedRules;
        return this.matchingRuleOptions.map(rule => ({
            ...rule,
            checked: selectedRules.includes(rule.value)
        }));
    }
    
    get editingJobScope() { return this.editJobConfig.scope; }
    get editingJobRecordLimit() { return this.editJobConfig.recordLimit; }
    
    // ========== Méthodes utilitaires ==========
    
    getNextRunDate(job) {
        if (job.scheduleType !== 'RECURRING') {
            return job.scheduledDateTime ? new Date(job.scheduledDateTime).toLocaleString() : null;
        }
        
        const now = new Date();
        const startDate = job.startDateTime ? new Date(job.startDateTime) : null;
        if (!startDate) return null;
        
        let nextDate = new Date(startDate);
        const recurrence = job.recurrence;
        const interval = job.recurrenceInterval || 1;
        
        while (nextDate < now) {
            if (recurrence === 'DAILY') {
                nextDate.setDate(nextDate.getDate() + interval);
            } else if (recurrence === 'WEEKLY') {
                nextDate.setDate(nextDate.getDate() + (7 * interval));
            } else if (recurrence === 'MONTHLY') {
                nextDate.setMonth(nextDate.getMonth() + interval);
            }
        }
        
        const endDate = job.endDateTime ? new Date(job.endDateTime) : null;
        if (endDate && nextDate > endDate) {
            return 'Terminé';
        }
        
        return nextDate.toLocaleString();
    }
    
    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
    
    resetNewScanConfig() {
        this.newScanConfig = {
            objectApiName: 'Lead',
            selectedRules: [],
            scope: 'ALL',
            recordLimit: 0,
            executionMode: 'IMMEDIATE',
            scheduledDateTime: '',
            recurrence: 'DAILY',
            autoMergeExact: true,
            sendReport: false,
            emailRecipients: '', 
            startDateTime: '',
            endDateTime: ''
        };
    }
    
    initializeMergeResult() {
        if (this.previewGroup && this.previewGroup.records) {
            const masterRecord = this.previewGroup.records.find(r => r.isMaster === true);
            if (masterRecord) {
                this.mergeResultFields = masterRecord.fields.map(field => ({
                    id: field.id,
                    label: field.label,
                    value: field.value,
                    sourceLabel: masterRecord.name
                }));
            }
        }
    }
    
    // ========== Handlers - Navigation ==========
    
    handleShowRunning() { this.selectedTab = 'RUNNING'; }
    handleShowPaused() { this.selectedTab = 'PAUSED'; }
    handleShowScheduled() { this.selectedTab = 'SCHEDULED'; }
    handleShowCompleted() { this.selectedTab = 'COMPLETED'; }
    
    handleSearchChange(event) {
        this.searchTerm = event.detail.value;
    }
    
    handleObjectFilterChange(event) {
        this.filterObject = event.detail.value;
    }
    
    // ========== Handlers - Nouveau scan ==========
    
    handleNewScan() {
        this.currentStep = 1;
        this.showNewScanModal = true;
    }
    
    handleCloseNewScanModal() {
        this.showNewScanModal = false;
        this.resetNewScanConfig();
        this.currentStep = 1;
    }
    
    handleNewScanChange(event) {
        const field = event.currentTarget.dataset.field;
         const value = event.detail.value;
    
    console.log('🟢 handleNewScanChange - field:', field, 'value:', value);
    
        this.newScanConfig = { ...this.newScanConfig, [field]: event.detail.value };

         if (field === 'sendReport') {
        console.log('📧 sendReport est maintenant:', this.newScanConfig.sendReport);
        this.newScanConfig = { ...this.newScanConfig };
    }
    }
    
    handleRuleCheckbox(event) {
        const ruleValue = event.currentTarget.dataset.ruleValue;
        let selectedRules = [...this.newScanConfig.selectedRules];
        
        if (event.target.checked) {
            if (!selectedRules.includes(ruleValue)) selectedRules.push(ruleValue);
        } else {
            selectedRules = selectedRules.filter(r => r !== ruleValue);
        }
        this.newScanConfig = { ...this.newScanConfig, selectedRules: selectedRules };
    }
    
    handleNextStep() {
        if (this.currentStep === 1 && !this.newScanConfig.objectApiName) {
            this.showToast('Erreur', 'Veuillez sélectionner un objet', 'error');
            return;
        }
        if (this.currentStep === 2 && this.newScanConfig.selectedRules.length === 0) {
            this.showToast('Erreur', 'Veuillez sélectionner au moins une règle', 'error');
            return;
        }
        this.currentStep++;
    }
    
    handlePreviousStep() {
        this.currentStep--;
    }
    
    handleStartNewScan() {
        const config = this.newScanConfig;
        const now = new Date();
        const scanId = 'scan_' + now.getTime();
        const ruleLabels = config.selectedRules.map(r => {
            const found = this.matchingRuleOptions.find(opt => opt.value === r);
            return found ? found.label : r;
        });
        
        const newJob = {
            id: scanId,
            name: `Scan ${config.objectApiName} - ${now.toLocaleDateString()}`,
            objectApiName: config.objectApiName,
            objectLabel: config.objectApiName,
            scope: config.scope,
            recordLimit: config.recordLimit,
            rules: config.selectedRules,
            rulesLabel: ruleLabels.join(', '),
            status: config.executionMode === 'IMMEDIATE' ? 'RUNNING' : 'SCHEDULED',
            progress: 0,
            duplicatesFound: 0,
            createdAt: now,
            scheduledDateTime: config.executionMode !== 'IMMEDIATE' ? new Date(config.scheduledDateTime) : null,
            completedDate: null,
            autoMergeExact: config.autoMergeExact,
            sendReport: config.sendReport,
            emailRecipients: config.emailRecipients,
            scheduleType: config.executionMode === 'RECURRING' ? 'RECURRING' : 'ONCE',
            startDateTime: config.executionMode === 'RECURRING' ? config.startDateTime : null,
            endDateTime: config.executionMode === 'RECURRING' ? config.endDateTime : null,
            recurrence: config.executionMode === 'RECURRING' ? config.recurrence : null
        };
        
        this.jobs = [...this.jobs, newJob];
        this.showNewScanModal = false;
        this.resetNewScanConfig();
        this.currentStep = 1;
        
        if (config.executionMode === 'IMMEDIATE') {
            this.simulateScanProgress(scanId);
        }
        
        this.showToast('Scan lancé', `Le scan a été ${config.executionMode === 'IMMEDIATE' ? 'démarré' : 'planifié'}`, 'success');
    }
    
    simulateScanProgress(scanId) {
        let progress = 0;
        const interval = setInterval(() => {
            const jobIndex = this.jobs.findIndex(j => j.id === scanId);
            if (jobIndex === -1 || this.jobs[jobIndex].status !== 'RUNNING') {
                clearInterval(interval);
                return;
            }
            
            progress += Math.floor(Math.random() * 15) + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                const updatedJobs = [...this.jobs];
                updatedJobs[jobIndex] = {
                    ...updatedJobs[jobIndex],
                    progress: 100,
                    status: 'COMPLETED',
                    duplicatesFound: Math.floor(Math.random() * 50) + 5,
                    completedDate: new Date()
                };
                this.jobs = updatedJobs;
                this.showToast('Scan terminé', `Le scan ${updatedJobs[jobIndex].name} est terminé`, 'success');
            } else {
                const updatedJobs = [...this.jobs];
                updatedJobs[jobIndex] = { ...updatedJobs[jobIndex], progress: progress };
                this.jobs = updatedJobs;
            }
        }, 800);
    }
    
    // ========== Handlers - Actions sur les jobs ==========
    
    handleSelectJob(event) {
        const jobId = event.currentTarget.dataset.jobId;
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;
        
        if (job.status === 'COMPLETED') {
            this.selectedJob = job;
            this.loadDuplicatesForJob(job);
            this.showDuplicatesModal = true;
        } else {
            this.selectedJobDetail = { ...job };
            this.showJobDetailModal = true;
        }
    }
    
    loadDuplicatesForJob(job) {
        this.duplicateGroups = [
            {
                id: 'dup1',
                objectLabel: job.objectLabel,
                objectApiName: job.objectApiName,
                ruleName: job.rulesLabel.split(',')[0],
                confidence: 98,
                confidenceLabel: '98%',
                status: 'PENDING',
                statusLabel: 'En attente',
                statusClass: 'badge-warning',
                confidenceStyle: 'width:98%;background:#2e844a',
                confidenceTextStyle: 'color:#2e844a',
                pillStyle: OBJ_COLORS[job.objectApiName] || OBJ_COLORS.default,
                masterName: 'Marie Dupont',
                records: [
                    { id: 'r1', name: 'Marie Dupont', isMaster: true, fields: [{ id: 'f1', label: 'Email', value: 'marie@email.com' }, { id: 'f2', label: 'Téléphone', value: '0612345678' }] },
                    { id: 'r2', name: 'M. Dupont', isMaster: false, fields: [{ id: 'f1', label: 'Email', value: 'm.dupont@email.com' }, { id: 'f2', label: 'Téléphone', value: '0612345678' }] }
                ]
            },
            {
                id: 'dup2',
                objectLabel: job.objectLabel,
                objectApiName: job.objectApiName,
                ruleName: job.rulesLabel.split(',')[0],
                confidence: 82,
                confidenceLabel: '82%',
                status: 'PENDING',
                statusLabel: 'En attente',
                statusClass: 'badge-warning',
                confidenceStyle: 'width:82%;background:#ff9e2c',
                confidenceTextStyle: 'color:#b75000',
                pillStyle: OBJ_COLORS[job.objectApiName] || OBJ_COLORS.default,
                masterName: 'Jean-Pierre Martin',
                records: [
                    { id: 'r3', name: 'Jean-Pierre Martin', isMaster: true, fields: [{ id: 'f1', label: 'Email', value: 'jp@email.com' }, { id: 'f2', label: 'Téléphone', value: '0698765432' }] },
                    { id: 'r4', name: 'JP Martin', isMaster: false, fields: [{ id: 'f1', label: 'Email', value: 'jeanpierre@email.com' }, { id: 'f2', label: 'Téléphone', value: '0698765432' }] }
                ]
            }
        ];
    }
    
    handlePauseJob(event) {
        event.stopPropagation();
        const jobId = event.currentTarget.dataset.jobId;
        this.jobs = this.jobs.map(j => j.id === jobId ? { ...j, status: 'PAUSED' } : j);
        this.showToast('Scan en pause', 'Le scan a été mis en pause', 'warning');
    }
    
    handleResumeJob(event) {
        event.stopPropagation();
        const jobId = event.currentTarget.dataset.jobId;
        const job = this.jobs.find(j => j.id === jobId);
        if (job && job.status === 'PAUSED') {
            this.jobs = this.jobs.map(j => j.id === jobId ? { ...j, status: 'RUNNING' } : j);
            this.showToast('Scan repris', `Le scan ${job.name} a été repris`, 'success');
            this.simulateScanProgress(jobId);
        }
    }
    
    handleStopJob(event) {
        event.stopPropagation();
        this.jobToDelete = this.jobs.find(j => j.id === event.currentTarget.dataset.jobId);
        this.showDeleteConfirmModal = true;
    }
    
    handleEditJob(event) {
        event.stopPropagation();
        const jobId = event.currentTarget.dataset.jobId;
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
            this.editingJob = job;
            this.editJobConfig = {
                scope: job.scope || 'ALL',
                recordLimit: job.recordLimit || 0,
                selectedRules: [...(job.rules || [])]
            };
            this.showEditJobModal = true;
        }
    }
    
    handleDeleteJob(event) {
        event.stopPropagation();
        const jobId = event.currentTarget.dataset.jobId;
        this.jobToDelete = this.jobs.find(j => j.id === jobId);
        this.showDeleteConfirmModal = true;
    }
    
    handleConfirmDelete() {
        if (this.jobToDelete) {
            this.jobs = this.jobs.filter(j => j.id !== this.jobToDelete.id);
            this.showToast('Supprimé', 'Le scan a été supprimé', 'success');
            
            if (this.showJobDetailModal && this.selectedJobDetail?.id === this.jobToDelete.id) {
                this.showJobDetailModal = false;
                this.selectedJobDetail = null;
            }
        }
        this.showDeleteConfirmModal = false;
        this.jobToDelete = null;
    }
    
    handleExportCsv(event) {
        event.stopPropagation();
        const jobId = event.currentTarget.dataset.jobId;
        const job = this.jobs.find(j => j.id === jobId);
        this.showToast('Export CSV', `Export des doublons pour ${job.name} en cours...`, 'info');
    }
    
    handleExportCurrentCsv() {
        this.showToast('Export CSV', 'Export en cours...', 'info');
    }
    
    // ========== Handlers - Modals ==========
    
    handleCloseJobDetailModal() {
        this.showJobDetailModal = false;
        this.selectedJobDetail = null;
    }
    
    handleCloseEditJobModal() {
        this.showEditJobModal = false;
        this.editingJob = null;
    }
    
    handleCloseDeleteConfirmModal() {
        this.showDeleteConfirmModal = false;
        this.jobToDelete = null;
    }
    
    handleCloseDuplicatesModal() {
        this.showDuplicatesModal = false;
        this.selectedJob = null;
        this.duplicateGroups = [];
    }
    
    handleOpenGroupPreview(event) {
        event.stopPropagation();
        const groupId = event.currentTarget.dataset.groupId;
        this.previewGroup = this.duplicateGroups.find(g => g.id === groupId);
        this.initializeMergeResult(); 
        this.showPreviewModal = true;
    }
    
    handlePreviewGroup(event) {
        event.stopPropagation();
        const groupId = event.currentTarget.dataset.groupId;
        this.previewGroup = this.duplicateGroups.find(g => g.id === groupId);
        this.initializeMergeResult(); 
        this.showPreviewModal = true;
    }
    
    handleMergeGroup(event) {
        event.stopPropagation();
        const groupId = event.currentTarget.dataset.groupId;
        const group = this.duplicateGroups.find(g => g.id === groupId);
        
        if (group) {
            this.previewGroup = group;
            if (this.previewGroup && this.previewGroup.records) {
                const masterRecord = this.previewGroup.records.find(r => r.isMaster === true);
                if (masterRecord) {
                    this.mergeResultFields = masterRecord.fields.map(field => ({
                        id: field.id,
                        label: field.label,
                        value: field.value,
                        sourceLabel: masterRecord.name
                    }));
                }
            }
            this.showPreviewModal = true;
            this.showDuplicatesModal = false;
        }
    }
    
    handleClosePreviewModal() {
        this.showPreviewModal = false;
        this.previewGroup = null;
        this.mergeResultFields = [];
    }
    
    handleSelectMergeValue(event) {
        const fieldId = event.currentTarget.dataset.fieldId;
        const fieldLabel = event.currentTarget.dataset.fieldLabel;
        const fieldValue = event.currentTarget.dataset.fieldValue;
        const recordId = event.currentTarget.dataset.recordId;
        const record = this.previewGroup.records.find(r => r.id === recordId);
        const sourceLabel = record.name;
        
        const existingIndex = this.mergeResultFields.findIndex(f => f.id === fieldId);
        if (existingIndex >= 0) {
            const updatedFields = [...this.mergeResultFields];
            updatedFields[existingIndex] = {
                ...updatedFields[existingIndex],
                value: fieldValue,
                sourceLabel: sourceLabel
            };
            this.mergeResultFields = updatedFields;
        } else {
            this.mergeResultFields = [
                ...this.mergeResultFields,
                {
                    id: fieldId,
                    label: fieldLabel,
                    value: fieldValue,
                    sourceLabel: sourceLabel
                }
            ];
        }
        
        this.showToast('Valeur sélectionnée', `${fieldLabel} mis à jour avec la valeur de ${sourceLabel}`, 'success');
    }
    
    handleConfirmMergeFromPreview() {
        this.showToast('Fusion', 'Les enregistrements ont été fusionnés avec succès', 'success');
        this.showPreviewModal = false;
        this.previewGroup = null;
        this.mergeResultFields = [];
    }
    
    handlePauseJobFromDetail() {
        if (this.selectedJobDetail) {
            this.jobs = this.jobs.map(j => j.id === this.selectedJobDetail.id ? { ...j, status: 'PAUSED' } : j);
            this.selectedJobDetail = { ...this.selectedJobDetail, status: 'PAUSED' };
            this.showToast('Scan en pause', 'Le scan a été mis en pause', 'warning');
        }
    }
    
    handleStopJobFromDetail() {
        this.jobToDelete = this.selectedJobDetail;
        this.showDeleteConfirmModal = true;
    }
    
    handleEditJobFromDetail() {
        if (this.selectedJobDetail) {
            this.editingJob = this.selectedJobDetail;
            this.editJobConfig = {
                scope: this.selectedJobDetail.scope || 'ALL',
                recordLimit: this.selectedJobDetail.recordLimit || 0,
                selectedRules: [...(this.selectedJobDetail.rules || [])]
            };
            this.showEditJobModal = true;
            this.showJobDetailModal = false;
        }
    }
    
    handleEditJobChange(event) {
        const field = event.currentTarget.dataset.field;
        this.editJobConfig = { ...this.editJobConfig, [field]: event.detail.value };
    }
    
    handleEditRuleCheckbox(event) {
        const ruleValue = event.currentTarget.dataset.ruleValue;
        let selectedRules = [...this.editJobConfig.selectedRules];
        
        if (event.target.checked) {
            if (!selectedRules.includes(ruleValue)) selectedRules.push(ruleValue);
        } else {
            selectedRules = selectedRules.filter(r => r !== ruleValue);
        }
        this.editJobConfig = { ...this.editJobConfig, selectedRules: selectedRules };
    }
    
    handleSaveEditJob() {
        if (this.editingJob) {
            const ruleLabels = this.editJobConfig.selectedRules.map(r => {
                const found = this.matchingRuleOptions.find(opt => opt.value === r);
                return found ? found.label : r;
            });
            
            this.jobs = this.jobs.map(j => 
                j.id === this.editingJob.id ? { 
                    ...j, 
                    scope: this.editJobConfig.scope,
                    recordLimit: this.editJobConfig.recordLimit,
                    rules: this.editJobConfig.selectedRules,
                    rulesLabel: ruleLabels.join(', ')
                } : j
            );
            
            if (this.selectedJobDetail && this.selectedJobDetail.id === this.editingJob.id) {
                this.selectedJobDetail = {
                    ...this.selectedJobDetail,
                    scope: this.editJobConfig.scope,
                    recordLimit: this.editJobConfig.recordLimit,
                    rules: this.editJobConfig.selectedRules,
                    rulesLabel: ruleLabels.join(', ')
                };
            }
            
            this.showEditJobModal = false;
            this.editingJob = null;
            this.showToast('Scan modifié', 'Les modifications ont été enregistrées', 'success');
        }
    }
}