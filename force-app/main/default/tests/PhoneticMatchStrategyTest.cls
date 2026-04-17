@isTest
public with sharing class PhoneticMatchStrategyTest {
    
    @isTest
    static void testMatchIdenticalStrings() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        // 'John' and 'John' should have same Soundex code 'J500'
        Double score = strategy.match('John', 'John');
        
        System.assertEquals(1.0, score, 'Identical strings should return 1.0');
    }
    
    @isTest
    static void testMatchPhoneticSimilar() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        // 'Robert' and 'Rupert' both have Soundex 'R163'
        Double score = strategy.match('Robert', 'Rupert');
        
        System.assertEquals(1.0, score, 'Phonetically similar names should return 1.0');
    }
    
    @isTest
    static void testMatchPhoneticSimilarAshcraft() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        // 'Ashcraft' and 'Ashcroft' both have Soundex 'A261'
        Double score = strategy.match('Ashcraft', 'Ashcroft');
        
        System.assertEquals(1.0, score, 'Phonetically similar names should return 1.0');
    }
    
    @isTest
    static void testMatchDifferentCase() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        Double score = strategy.match('ROBERT', 'rupert');
        
        System.assertEquals(1.0, score, 'Different case should return 1.0 after normalization');
    }
    
    @isTest
    static void testMatchWithSpaces() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        Double score = strategy.match('  Robert  ', 'Rupert');
        
        System.assertEquals(1.0, score, 'Spaces should be trimmed before comparison');
    }
    
    @isTest
    static void testMatchDifferentPhonetic() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        // 'John' (J500) vs 'Smith' (S530) - different Soundex codes
        Double score = strategy.match('John', 'Smith');
        
        System.assertEquals(0.0, score, 'Phonetically different names should return 0.0');
    }
    
    @isTest
    static void testMatchWithNullFirst() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        Double score = strategy.match(null, 'Robert');
        
        System.assertEquals(0.0, score, 'Null first value should return 0.0');
    }
    
    @isTest
    static void testMatchWithNullSecond() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        Double score = strategy.match('Robert', null);
        
        System.assertEquals(0.0, score, 'Null second value should return 0.0');
    }
    
    @isTest
    static void testMatchBothNull() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        Double score = strategy.match(null, null);
        
        System.assertEquals(0.0, score, 'Both null should return 0.0');
    }
    
    @isTest
    static void testMatchWithEmptyStrings() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        Double score = strategy.match('', '');
        
        System.assertEquals(1.0, score, 'Empty strings should return 1.0');
    }
    
    @isTest
    static void testMatchWithOneEmpty() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        Double score = strategy.match('Robert', '');
        
        System.assertEquals(0.0, score, 'One empty string should return 0.0');
    }
    
    @isTest
    static void testMatchTymczak() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        // 'Tymczak' and 'Tymczak' - same name
        Double score = strategy.match('Tymczak', 'Tymczak');
        
        System.assertEquals(1.0, score, 'Same name should return 1.0');
    }
    
    @isTest
    static void testMatchPfister() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        // 'Pfister' and 'Pfister' - same name
        Double score = strategy.match('Pfister', 'Pfister');
        
        System.assertEquals(1.0, score, 'Same name should return 1.0');
    }
    
    @isTest
    static void testGetMethodName() {
        PhoneticMatchStrategy strategy = new PhoneticMatchStrategy();
        
        String methodName = strategy.getMethodName();
        
        System.assertEquals('Phonétique', methodName, 'Method name should be Phonétique');
    }
}