public with sharing class PhoneticMatchStrategy implements IMatchingStrategy {
    
    public Double match(Object fieldValue, Object compareValue) {
        // Stub : retourne 0.7 pour l'instant
        // Logique complète (Soundex, Metaphone) viendra en Phase 2
        return 0.7;
    }
    
    public String getMethodName() {
        return 'Phonétique';
    }
}