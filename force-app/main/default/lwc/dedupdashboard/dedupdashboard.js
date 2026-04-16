import { LightningElement, track, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
// import getDashboardStats from '@salesforce/apex/DedupDashboardController.getDashboardStats';
// import runScan from '@salesforce/apex/DedupScanController.runScan';

export default class DedupDashboard extends NavigationMixin(LightningElement) {

    @track isLoading = false;

    // -- Static mock data (replace with @wire / Apex calls) --

    orgName = 'Acme Corp Production';
    lastSyncLabel = "Aujourd'hui à 09:42";

    kpiCards = [
        {
            id: 'k1',
            label: 'Doublons détectés',
            value: '3 847',
            delta: '+284 depuis hier',
            deltaClass: 'kpi-delta kpi-delta--danger',
            deltaIcon: 'utility:arrowup',
            accentStyle: 'background:#ba0517'
        },
        {
            id: 'k2',
            label: 'Fusionnés ce mois',
            value: '1 209',
            delta: '+12% vs mois dernier',
            deltaClass: 'kpi-delta kpi-delta--success',
            deltaIcon: 'utility:arrowup',
            accentStyle: 'background:#2e844a'
        },
        {
            id: 'k3',
            label: 'Règles actives',
            value: '7',
            delta: 'Sur 12 règles configurées',
            deltaClass: 'kpi-delta kpi-delta--neutral',
            deltaIcon: 'utility:info',
            accentStyle: 'background:#0070d2'
        },
        {
            id: 'k4',
            label: 'Qualité des données',
            value: '82%',
            delta: '+3% cette semaine',
            deltaClass: 'kpi-delta kpi-delta--success',
            deltaIcon: 'utility:arrowup',
            accentStyle: 'background:#ff9e2c'
        }
    ];

    objectStats = [
        {
            id: 'o1',
            apiName: 'Lead',
            initials: 'L',
            name: 'Leads',
            totalLabel: '48 230 enregistrements',
            duplicates: '1 842',
            pct: 38,
            pctLabel: '38%',
            badgeClass: 'badge-danger',
            iconStyle: 'background:#f88962',
            progressStyle: 'width:38%;background:#ba0517'
        },
        {
            id: 'o2',
            apiName: 'Contact',
            initials: 'C',
            name: 'Contacts',
            totalLabel: '125 410 enregistrements',
            duplicates: '1 450',
            pct: 14,
            pctLabel: '14%',
            badgeClass: 'badge-warning',
            iconStyle: 'background:#a094ed',
            progressStyle: 'width:14%;background:#ff9e2c'
        },
        {
            id: 'o3',
            apiName: 'Account',
            initials: 'A',
            name: 'Accounts',
            totalLabel: '32 870 enregistrements',
            duplicates: '555',
            pct: 17,
            pctLabel: '17%',
            badgeClass: 'badge-warning',
            iconStyle: 'background:#57b5e5',
            progressStyle: 'width:17%;background:#ff9e2c'
        },
        {
            id: 'o4',
            apiName: 'CustomObject__c',
            initials: 'CO',
            name: 'Custom Objects',
            totalLabel: '8 100 enregistrements',
            duplicates: '0',
            pct: 0,
            pctLabel: '0%',
            badgeClass: 'badge-success',
            iconStyle: 'background:#68c7b6',
            progressStyle: 'width:0%;background:#2e844a'
        }
    ];

    recentActivity = [
        {
            id: 'a1',
            message: '478 doublons Leads fusionnés automatiquement',
            timeLabel: 'Il y a 2h',
            detail: 'Règle : Email exact match',
            dotStyle: 'background:#2e844a'
        },
        {
            id: 'a2',
            message: 'Scan Contacts terminé — 1 450 doublons trouvés',
            timeLabel: 'Il y a 4h',
            detail: 'Scan planifié quotidien',
            dotStyle: 'background:#0070d2'
        },
        {
            id: 'a3',
            message: 'Règle "Fuzzy Name + Phone" activée',
            timeLabel: 'Hier à 15h30',
            detail: 'Modifiée par Sarah Martin',
            dotStyle: 'background:#ff9e2c'
        },
        {
            id: 'a4',
            message: '34 doublons Accounts marqués pour révision manuelle',
            timeLabel: 'Hier à 11h12',
            detail: 'Confiance < 70%',
            dotStyle: 'background:#ba0517'
        }
    ];

    activeScans = [
        { id: 's1', name: 'Scan Leads — Email + Nom', objectLabel: 'Lead', startedLabel: 'il y a 8 min', progress: 62, progressLabel: '62%' },
        { id: 's2', name: 'Scan Contacts — Téléphone', objectLabel: 'Contact', startedLabel: 'il y a 3 min', progress: 18, progressLabel: '18%' }
    ];

    get hasActiveScans() {
        return this.activeScans && this.activeScans.length > 0;
    }

    mergeJobs = [
        { id: 'm1', jobName: 'Merge Leads — Batch 001', object: 'Lead', merged: 478, status: 'Terminé', statusBadge: 'slds-badge_success', startDate: '15/04/2025 09:30', duration: '4 min 12s' },
        { id: 'm2', jobName: 'Merge Contacts — Email', object: 'Contact', merged: 221, status: 'Terminé', statusBadge: 'slds-badge_success', startDate: '14/04/2025 18:00', duration: '7 min 03s' },
        { id: 'm3', jobName: 'Merge Accounts — Nom exact', object: 'Account', merged: 0, status: 'Échec', statusBadge: 'slds-badge_error', startDate: '14/04/2025 10:15', duration: '0 min 42s' },
        { id: 'm4', jobName: 'Merge Leads — Batch 000', object: 'Lead', merged: 310, status: 'Terminé', statusBadge: 'slds-badge_success', startDate: '13/04/2025 09:30', duration: '3 min 55s' }
    ];

    mergeColumns = [
        { label: 'Nom du job', fieldName: 'jobName', type: 'text', sortable: true },
        { label: 'Objet', fieldName: 'object', type: 'text', sortable: true },
        { label: 'Fusionnés', fieldName: 'merged', type: 'number', sortable: true, cellAttributes: { alignment: 'left' } },
        { label: 'Statut', fieldName: 'status', type: 'text', sortable: true },
        { label: 'Date', fieldName: 'startDate', type: 'text', sortable: true },
        { label: 'Durée', fieldName: 'duration', type: 'text' }
    ];

    sortedBy = 'startDate';
    sortedDirection = 'desc';

    // -- Handlers --

    handleRunScan() {
        this.dispatchEvent(new ShowToastEvent({
            title: 'Scan lancé',
            message: 'Le scan de doublons a démarré. Vous serez notifié à la fin.',
            variant: 'success'
        }));
        // TODO: appeler l'Apex runScan()
    }

    handleScheduleScan() {
        this[NavigationMixin.Navigate]({
            type: 'standard__component',
            attributes: { componentName: 'c__dedupScanMerge' }
        });
    }

    handleViewDuplicates(event) {
        const objectApiName = event.currentTarget.dataset.object;
        this.dispatchEvent(new CustomEvent('viewduplicates', {
            detail: { objectApiName },
            bubbles: true
        }));
    }

    handleViewAllMerges() {
        this[NavigationMixin.Navigate]({
            type: 'standard__component',
            attributes: { componentName: 'c__dedupReports' }
        });
    }

    handleSort(event) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        // TODO: trier mergeJobs
    }
}