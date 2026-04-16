import { LightningElement, track } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const OBJ_COLORS = {
    Lead:    'background:#f88962;color:#ffffff',
    Contact: 'background:#a094ed;color:#ffffff',
    Account: 'background:#57b5e5;color:#ffffff'
};

const OP_COLORS = {
    MERGE:  'background:#e3f5e3;color:#2e844a',
    SCAN:   'background:#e8f4ff;color:#0070d2',
    IGNORE: 'background:#f3f2f2;color:#706e6b',
    UNDO:   'background:#fff3e0;color:#b75000'
};

export default class DedupReports extends LightningElement {

    @track filterPeriod    = '30_DAYS';
    @track filterObject    = '';
    @track filterOperation = '';
    @track filterUser      = '';
    @track searchTerm      = '';

    summaryKpis = [
        { id: 'k1', icon: 'utility:merge',    value: '1 209', label: 'Fusions ce mois' },
        { id: 'k2', icon: 'utility:search',   value: '14',    label: 'Scans effectués' },
        { id: 'k3', icon: 'utility:close',    value: '87',    label: 'Ignorés manuellement' },
        { id: 'k4', icon: 'utility:undo',     value: '3',     label: 'Annulations' },
        { id: 'k5', icon: 'utility:database', value: '82%',   label: 'Qualité globale' }
    ];

    trendData = [
        { id: 'd1',  dayLabel: '16/3', label: '16 mars',   count: 42,  barStyle: 'height:35%' },
        { id: 'd2',  dayLabel: '17/3', label: '17 mars',   count: 58,  barStyle: 'height:48%' },
        { id: 'd3',  dayLabel: '18/3', label: '18 mars',   count: 30,  barStyle: 'height:25%' },
        { id: 'd4',  dayLabel: '19/3', label: '19 mars',   count: 0,   barStyle: 'height:2%' },
        { id: 'd5',  dayLabel: '20/3', label: '20 mars',   count: 0,   barStyle: 'height:2%' },
        { id: 'd6',  dayLabel: '21/3', label: '21 mars',   count: 75,  barStyle: 'height:62%' },
        { id: 'd7',  dayLabel: '22/3', label: '22 mars',   count: 91,  barStyle: 'height:76%' },
        { id: 'd8',  dayLabel: '23/3', label: '23 mars',   count: 48,  barStyle: 'height:40%' },
        { id: 'd9',  dayLabel: '24/3', label: '24 mars',   count: 55,  barStyle: 'height:46%' },
        { id: 'd10', dayLabel: '25/3', label: '25 mars',   count: 62,  barStyle: 'height:52%' },
        { id: 'd11', dayLabel: '26/3', label: '26 mars',   count: 38,  barStyle: 'height:32%' },
        { id: 'd12', dayLabel: '27/3', label: '27 mars',   count: 0,   barStyle: 'height:2%' },
        { id: 'd13', dayLabel: '28/3', label: '28 mars',   count: 0,   barStyle: 'height:2%' },
        { id: 'd14', dayLabel: '29/3', label: '29 mars',   count: 120, barStyle: 'height:100%' },
        { id: 'd15', dayLabel: '30/3', label: '30 mars',   count: 88,  barStyle: 'height:73%' },
        { id: 'd16', dayLabel: '31/3', label: '31 mars',   count: 44,  barStyle: 'height:37%' },
        { id: 'd17', dayLabel: '1/4',  label: '1er avril', count: 67,  barStyle: 'height:56%' },
        { id: 'd18', dayLabel: '2/4',  label: '2 avril',   count: 53,  barStyle: 'height:44%' },
        { id: 'd19', dayLabel: '3/4',  label: '3 avril',   count: 0,   barStyle: 'height:2%' },
        { id: 'd20', dayLabel: '4/4',  label: '4 avril',   count: 0,   barStyle: 'height:2%' },
        { id: 'd21', dayLabel: '5/4',  label: '5 avril',   count: 78,  barStyle: 'height:65%' },
        { id: 'd22', dayLabel: '6/4',  label: '6 avril',   count: 95,  barStyle: 'height:79%' },
        { id: 'd23', dayLabel: '7/4',  label: '7 avril',   count: 71,  barStyle: 'height:59%' },
        { id: 'd24', dayLabel: '8/4',  label: '8 avril',   count: 82,  barStyle: 'height:68%' },
        { id: 'd25', dayLabel: '9/4',  label: '9 avril',   count: 47,  barStyle: 'height:39%' },
        { id: 'd26', dayLabel: '10/4', label: '10 avril',  count: 0,   barStyle: 'height:2%' },
        { id: 'd27', dayLabel: '11/4', label: '11 avril',  count: 0,   barStyle: 'height:2%' },
        { id: 'd28', dayLabel: '12/4', label: '12 avril',  count: 103, barStyle: 'height:86%' },
        { id: 'd29', dayLabel: '13/4', label: '13 avril',  count: 86,  barStyle: 'height:72%' },
        { id: 'd30', dayLabel: '14/4', label: '14 avril',  count: 74,  barStyle: 'height:62%' }
    ];

    objectBreakdown = [
        { id: 'o1', initials: 'L',  name: 'Leads',    count: 698, pctLabel: '57%', iconStyle: 'background:#f88962', fillStyle: 'width:57%;background:#f88962' },
        { id: 'o2', initials: 'C',  name: 'Contacts', count: 411, pctLabel: '34%', iconStyle: 'background:#a094ed', fillStyle: 'width:34%;background:#a094ed' },
        { id: 'o3', initials: 'A',  name: 'Accounts', count: 100, pctLabel: '8%',  iconStyle: 'background:#57b5e5', fillStyle: 'width:8%;background:#57b5e5'  }
    ];

    operationLogs = [
        {
            id: 'l1', dateLabel: '15/04/2025', timeLabel: '09:42', operation: 'MERGE',
            operationLabel: 'Fusion', objectApiName: 'Lead', objectLabel: 'Lead',
            ruleName: 'Email exact match', processed: 478, total: 478,
            userName: 'Sarah Martin', userInitials: 'SM',
            duration: '4 min 12s', status: 'SUCCESS', statusLabel: 'Réussi', statusClass: 'badge-success',
            canUndo: true
        },
        {
            id: 'l2', dateLabel: '15/04/2025', timeLabel: '09:30', operation: 'SCAN',
            operationLabel: 'Scan', objectApiName: 'Lead', objectLabel: 'Lead',
            ruleName: 'Email exact match', processed: 48230, total: 48230,
            userName: 'Système', userInitials: 'SY',
            duration: '8 min 44s', status: 'SUCCESS', statusLabel: 'Réussi', statusClass: 'badge-success',
            canUndo: false
        },
        {
            id: 'l3', dateLabel: '14/04/2025', timeLabel: '18:00', operation: 'MERGE',
            operationLabel: 'Fusion', objectApiName: 'Contact', objectLabel: 'Contact',
            ruleName: 'Nom fuzzy + Téléphone', processed: 221, total: 250,
            userName: 'Thomas Girard', userInitials: 'TG',
            duration: '7 min 03s', status: 'PARTIAL', statusLabel: 'Partiel', statusClass: 'badge-warning',
            canUndo: true
        },
        {
            id: 'l4', dateLabel: '14/04/2025', timeLabel: '10:15', operation: 'MERGE',
            operationLabel: 'Fusion', objectApiName: 'Account', objectLabel: 'Account',
            ruleName: 'Nom + Adresse', processed: 0, total: 42,
            userName: 'Thomas Girard', userInitials: 'TG',
            duration: '0 min 42s', status: 'ERROR', statusLabel: 'Échec', statusClass: 'badge-danger',
            canUndo: false
        },
        {
            id: 'l5', dateLabel: '13/04/2025', timeLabel: '17:22', operation: 'IGNORE',
            operationLabel: 'Ignoré', objectApiName: 'Contact', objectLabel: 'Contact',
            ruleName: 'Nom fuzzy + Téléphone', processed: 34, total: 34,
            userName: 'Marie Leroy', userInitials: 'ML',
            duration: '< 1s', status: 'SUCCESS', statusLabel: 'Réussi', statusClass: 'badge-success',
            canUndo: false
        },
        {
            id: 'l6', dateLabel: '13/04/2025', timeLabel: '09:30', operation: 'SCAN',
            operationLabel: 'Scan', objectApiName: 'Contact', objectLabel: 'Contact',
            ruleName: 'Nom fuzzy + Téléphone', processed: 125410, total: 125410,
            userName: 'Système', userInitials: 'SY',
            duration: '22 min 11s', status: 'SUCCESS', statusLabel: 'Réussi', statusClass: 'badge-success',
            canUndo: false
        },
        {
            id: 'l7', dateLabel: '12/04/2025', timeLabel: '14:05', operation: 'UNDO',
            operationLabel: 'Annulation', objectApiName: 'Lead', objectLabel: 'Lead',
            ruleName: 'Email exact match', processed: 12, total: 12,
            userName: 'Sarah Martin', userInitials: 'SM',
            duration: '1 min 08s', status: 'SUCCESS', statusLabel: 'Réussi', statusClass: 'badge-success',
            canUndo: false
        }
    ];

    // -- Options --

    periodOptions = [
        { label: '7 derniers jours', value: '7_DAYS' },
        { label: '30 derniers jours', value: '30_DAYS' },
        { label: 'Ce mois-ci', value: 'THIS_MONTH' },
        { label: 'Ce trimestre', value: 'THIS_QUARTER' },
        { label: 'Cette année', value: 'THIS_YEAR' }
    ];

    objectOptions = [
        { label: 'Tous les objets', value: '' },
        { label: 'Lead', value: 'Lead' },
        { label: 'Contact', value: 'Contact' },
        { label: 'Account', value: 'Account' }
    ];

    operationOptions = [
        { label: 'Toutes les opérations', value: '' },
        { label: 'Fusion', value: 'MERGE' },
        { label: 'Scan', value: 'SCAN' },
        { label: 'Ignoré', value: 'IGNORE' },
        { label: 'Annulation', value: 'UNDO' }
    ];

    userOptions = [
        { label: 'Tous les utilisateurs', value: '' },
        { label: 'Sarah Martin', value: 'Sarah Martin' },
        { label: 'Thomas Girard', value: 'Thomas Girard' },
        { label: 'Marie Leroy', value: 'Marie Leroy' },
        { label: 'Système', value: 'Système' }
    ];

    // -- Computed --

    get filteredLogs() {
        return this.operationLogs
            .filter(l => {
                const matchObj  = !this.filterObject    || l.objectApiName === this.filterObject;
                const matchOp   = !this.filterOperation || l.operation      === this.filterOperation;
                const matchUser = !this.filterUser      || l.userName        === this.filterUser;
                const matchSearch = !this.searchTerm
                    || l.userName.toLowerCase().includes(this.searchTerm.toLowerCase())
                    || l.ruleName.toLowerCase().includes(this.searchTerm.toLowerCase())
                    || l.operationLabel.toLowerCase().includes(this.searchTerm.toLowerCase());
                return matchObj && matchOp && matchUser && matchSearch;
            })
            .map(l => ({
                ...l,
                objPillStyle: OBJ_COLORS[l.objectApiName] || 'background:#888;color:#fff',
                opTagStyle:   OP_COLORS[l.operation]      || 'background:#f3f2f2;color:#706e6b'
            }));
    }

    // -- Handlers --

    handlePeriodChange(e)    { this.filterPeriod    = e.detail.value; }
    handleObjectChange(e)    { this.filterObject    = e.detail.value; }
    handleOperationChange(e) { this.filterOperation = e.detail.value; }
    handleUserChange(e)      { this.filterUser      = e.detail.value; }
    handleSearch(e)          { this.searchTerm      = e.detail.value; }

    handleExportCSV() {
        this.dispatchEvent(new ShowToastEvent({ title: 'Export CSV', message: 'Préparation du fichier CSV...', variant: 'info' }));
    }

    handleGenerateReport() {
        this.dispatchEvent(new ShowToastEvent({ title: 'Rapport généré', message: 'Le rapport PDF a été créé et envoyé par email.', variant: 'success' }));
    }

    handleViewLog(event) {
        const logId = event.currentTarget.dataset.logId;
        this.dispatchEvent(new ShowToastEvent({ title: 'Détail', message: `Affichage du log ${logId} (à connecter au composant de détail).`, variant: 'info' }));
    }

    handleUndoLog(event) {
        const logId = event.currentTarget.dataset.logId;
        this.operationLogs = this.operationLogs.map(l =>
            l.id === logId ? { ...l, canUndo: false, status: 'UNDONE', statusLabel: 'Annulé', statusClass: 'badge-warning' } : l
        );
        this.dispatchEvent(new ShowToastEvent({ title: 'Opération annulée', message: 'La fusion a été annulée avec succès.', variant: 'warning' }));
    }
}