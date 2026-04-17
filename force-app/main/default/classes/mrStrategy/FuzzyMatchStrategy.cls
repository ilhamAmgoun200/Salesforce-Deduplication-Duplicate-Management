public with sharing class FuzzyMatchStrategy implements IMatchingStrategy {
    
     public Double match(Object fieldValue, Object compareValue) {
        if (fieldValue == null || compareValue == null) {
            return 0.0;
        }

        String s1 = StringUtils.normalize(String.valueOf(fieldValue));
        String s2 = StringUtils.normalize(String.valueOf(compareValue));

        Integer distance = StringUtils.levenshteinDistance(s1, s2);
        Integer maxLength = Math.max(s1.length(), s2.length());

        // Avoid division by zero
        if (maxLength == 0) {
            return 1.0;
        }

        Double similarity = 1.0 - ((Double) distance / maxLength);

        return similarity;
    }

    public String getMethodName() {
        return 'Fuzzy';
    }
}