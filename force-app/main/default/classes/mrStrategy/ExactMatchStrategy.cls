public with sharing class ExactMatchStrategy implements IMatchingStrategy {
    
    public Double match(Object fieldValue, Object compareValue) {
        // Stub : retourne 1.0 si identiques, 0.0 sinon
        // Logique complète viendra en Phase 2
        return 1.0;
    }
    
    public String getMethodName() {
        return 'Exact';
    }
}