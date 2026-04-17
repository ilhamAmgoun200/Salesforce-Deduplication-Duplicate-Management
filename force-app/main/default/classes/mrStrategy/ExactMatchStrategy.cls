public with sharing class ExactMatchStrategy implements IMatchingStrategy {
    
     public Double match(Object fieldValue, Object compareValue) {
        if (fieldValue == null || compareValue == null) {
            return 0.0;
        }

        String value1 = StringUtils.normalize(String.valueOf(fieldValue));
        String value2 = StringUtils.normalize(String.valueOf(compareValue));

        return value1 == value2 ? 1.0 : 0.0;
    }

    public String getMethodName() {
        return 'Exact';
    }
}