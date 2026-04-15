import { LightningElement, track } from 'lwc';

export default class MatchingRuleTest extends LightningElement {
    @track result = '';

    handleTest() {
        // Simuler un test de matching rule
        this.result = '✅ Matching Rule active — aucun doublon détecté';
    }
}