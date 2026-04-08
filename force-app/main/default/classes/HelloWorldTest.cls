@isTest
private class HelloWorldTest {
    
    @isTest
    static void testGreetWithName() {
        String result = HelloWorld.greet('Ilham');
        Assert.areEqual('Hello, Ilham!', result, 'Should greet by name');
    }
    
    @isTest
    static void testGreetWithoutName() {
        String result = HelloWorld.greet(null);
        Assert.areEqual('Hello, World!', result, 'Should return default greeting');
    }
    
    @isTest
    static void testGreetEmptyString() {
        String result = HelloWorld.greet('');
        Assert.areEqual('Hello, World!', result, 'Should handle empty string');
    }
    
    @isTest
    static void testAdd() {
        Integer result = HelloWorld.add(3, 7);
        Assert.areEqual(10, result, 'Should add two numbers');
    }
        // version 6.0

}