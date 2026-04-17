@isTest
public with sharing class FuzzyMatchStrategyTest {
    
    @isTest
    static void testMatchIdenticalStrings() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match('John Doe', 'John Doe');
        
        System.assertEquals(1.0, score, 'Identical strings should return 1.0');
    }
    
    @isTest
    static void testMatchWithOneTypo() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        // 'hallo' vs 'hello' : distance = 1, maxLength = 5, similarity = 1 - (1/5) = 0.8
        Double score = strategy.match('hallo', 'hello');
        
        System.assertEquals(0.8, score, 'One typo should return 0.8');
    }
    
    @isTest
    static void testMatchWithTwoTypos() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        // 'halco' vs 'hello' : distance = 2, maxLength = 5, similarity = 1 - (2/5) = 0.6
        Double score = strategy.match('halco', 'hello');
        
        System.assertEquals(0.6, score, 'Two typos should return 0.6');
    }
    
    @isTest
    static void testMatchCompletelyDifferent() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        // 'abc' vs 'xyz' : distance = 3, maxLength = 3, similarity = 1 - (3/3) = 0.0
        Double score = strategy.match('abc', 'xyz');
        
        System.assertEquals(0.0, score, 'Completely different strings should return 0.0');
    }
    
    @isTest
    static void testMatchWithDifferentCase() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match('JOHN DOE', 'john doe');
        
        System.assertEquals(1.0, score, 'Different case should return 1.0 after normalization');
    }
    
    @isTest
    static void testMatchWithSpaces() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match('  John Doe  ', 'John Doe');
        
        System.assertEquals(1.0, score, 'Spaces should be trimmed before comparison');
    }
    
    @isTest
    static void testMatchWithNullFirst() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match(null, 'John Doe');
        
        System.assertEquals(0.0, score, 'Null first value should return 0.0');
    }
    
    @isTest
    static void testMatchWithNullSecond() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match('John Doe', null);
        
        System.assertEquals(0.0, score, 'Null second value should return 0.0');
    }
    
    @isTest
    static void testMatchBothNull() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match(null, null);
        
        System.assertEquals(0.0, score, 'Both null should return 0.0');
    }
    
    @isTest
    static void testMatchWithEmptyStrings() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match('', '');
        
        System.assertEquals(1.0, score, 'Empty strings should return 1.0');
    }
    
    @isTest
    static void testMatchWithOneEmpty() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        Double score = strategy.match('John Doe', '');
        
        System.assertEquals(0.0, score, 'One empty string should return 0.0');
    }
    
    @isTest
    static void testMatchPartialSimilarity() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        // 'Jean' vs 'Jeanne' : distance = 2, maxLength = 6, similarity = 1 - (2/6) = 0.666...
        Double score = strategy.match('Jean', 'Jeanne');
        
        System.assertEquals(true, score > 0.6 && score < 0.7, 'Partial similarity should return ~0.67');
    }
    
    @isTest
    static void testGetMethodName() {
        FuzzyMatchStrategy strategy = new FuzzyMatchStrategy();
        
        String methodName = strategy.getMethodName();
        
        System.assertEquals('Fuzzy', methodName, 'Method name should be Fuzzy');
    }
}