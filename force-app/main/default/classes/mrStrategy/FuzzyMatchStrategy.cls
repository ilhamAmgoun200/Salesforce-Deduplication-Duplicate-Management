public with sharing class FuzzyMatchStrategy implements IMatchingStrategy {
    
    public Double match(Object fieldValue, Object compareValue) {
        // Stub : retourne 0.8 pour l'instant
        // Logique complète (Levenshtein) viendra en Phase 2
        return 0.8;
    }
    
    public String getMethodName() {
        return 'Fuzzy';
    }
}