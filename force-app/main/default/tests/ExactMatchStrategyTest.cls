@isTest
public with sharing class ExactMatchStrategyTest {
    
    @isTest
    static void testMatchIdenticalStrings() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match('John Doe', 'John Doe');
        
        System.assertEquals(1.0, score, 'Identical strings should return 1.0');
    }
    
    @isTest
    static void testMatchDifferentCase() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match('JOHN DOE', 'john doe');
        
        System.assertEquals(1.0, score, 'Different case should return 1.0 after normalization');
    }
    
    @isTest
    static void testMatchWithSpaces() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match('  John Doe  ', 'John Doe');
        
        System.assertEquals(1.0, score, 'Spaces should be trimmed before comparison');
    }
    
    @isTest
    static void testMatchDifferentStrings() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match('John Doe', 'Jane Smith');
        
        System.assertEquals(0.0, score, 'Different strings should return 0.0');
    }
    
    @isTest
    static void testMatchWithNullFirst() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match(null, 'John Doe');
        
        System.assertEquals(0.0, score, 'Null first value should return 0.0');
    }
    
    @isTest
    static void testMatchWithNullSecond() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match('John Doe', null);
        
        System.assertEquals(0.0, score, 'Null second value should return 0.0');
    }
    
    @isTest
    static void testMatchBothNull() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match(null, null);
        
        System.assertEquals(0.0, score, 'Both null should return 0.0');
    }
    
    @isTest
    static void testMatchWithEmptyStrings() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match('', '');
        
        System.assertEquals(1.0, score, 'Empty strings should return 1.0');
    }
    
    @isTest
    static void testMatchWithOneEmpty() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        Double score = strategy.match('John Doe', '');
        
        System.assertEquals(0.0, score, 'One empty string should return 0.0');
    }
    
    @isTest
    static void testGetMethodName() {
        ExactMatchStrategy strategy = new ExactMatchStrategy();
        
        String methodName = strategy.getMethodName();
        
        System.assertEquals('Exact', methodName, 'Method name should be Exact');
    }
}