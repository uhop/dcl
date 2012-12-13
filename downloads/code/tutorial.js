// *This file is written using a literate JavaScript. You can download
// [this tutorial](/downloads/code/tutorial.js) to use as a local reference
// or to run it locally.*

// *While `dcl` works great in browsers using an AMD loader or
// even simple `<script>`, this tutorial is assumed to be run with
// [node.js](http://nodejs.org).*

// For our examples we will need the main `dcl` module:
var dcl = require("dcl");

// ## Inheritance, and constructors

// Let's declare a class derived from Object:
var Person = dcl(null, {
  // Name of class. It is optional, but highly recommended, because it will help while debugging your objects.
  declaredClass: "Person",
  // A default name as a class-level constant:
  name: "Anonymous",
  // A constructor is a method named ... `constructor`
  constructor: function(name){
    if(name){
      this.name = name;
    }
    console.log("Person " + this.name + " is created");
  }
});

// We can derive more classes from it using single inheritance. Let's define a bureaucrat (yes, it is a person too!):
var Bureaucrat = dcl(Person, {
  declaredClass: "Bureaucrat",
  // Remember that all inherited constructors are chained in automatically!
  constructor: function(name){
    console.log("Bureaucrat " + this.name + " is created");
  },
  approve: function(document){
    console.log("Rejected by " + this.name); // NEVER!
    return false;
  }
});

// Now we can create a typical anonymous clerk:

// Output:<br>
// `Person Anonymous is created`<br>
// `Bureaucrat Anonymous is created`
var clerk = new Bureaucrat();

// Let's ask him to approve something:

// Output:<br>`Rejected by Anonymous`
clerk.approve(123);

// As you can see it is trivial to define "classes" and derive them using single inheritance.

// Constructors are automatically chained and called from the farthest to the closest with the same arguments.
// Our Bureaucrat's constructor ignores name, because it knows that Person will take care of it.

// ## Mixins

// Let's declare one more class that will be used as a mixin. Any normal class would do.
var Speaker = dcl(null, {
  speak: function(msg){
    console.log(this.name + ": " + msg);
  }
});

// Now we are ready to create Talker from Person + Speaker:
var Talker = dcl([Person, Speaker],
  // It has no own methods for simplicity.
  {}
);

// Let's create Alice, who is a Talker:

// Output:<br>`Person Alice is created`
var alice = new Talker("Alice");

// Output:<br>`Alice: hello!`
alice.speak("hello!");

// ## Supercalls

// Let's declare another mixin, this time using a super call:
var Shouter = dcl(Speaker, {
  // Here we use the double function technique to inject
  // `sup` --- a method from a super class.
  speak: dcl.superCall(function(sup){
    return function(msg){
      // Theoretically it is possible that
      // there is no super method --- we can be last in line;
      // not in this case, though --- we are based
      // on Speaker meaning it will be always pulled in.
      if(sup){
        sup.call(this, msg.toUpperCase());
      }
    };
  })
});

// Let's create a Shouter called Sarge.
var Sarge = dcl([Talker, Shouter],
  // It has no own methods for simplicity.
  {}
);

// `Person Bob is created`
var bob = new Sarge("Bob");

// `Bob: GIVE ME TWENTY!`
bob.speak("give me twenty!");

// The double function technique for a super call allows you to work directly with a next method in chain ---
// no intermediaries means that this call is as fast as it can be, no run-time penalties are involved during method
// calls, and it greatly simplifies debugging.

// ## Anonymous one-off classes

// And, of course, our "classes" can be absolutely anonymous, like in this one-off "class":

// `Person Loud Bob is created`
var loudBob = new (dcl([Talker, Shouter], {}))("Loud Bob");

// `Loud Bob: ANYBODY HOME?`
loudBob.speak("Anybody home?");

// ## AOP

// We can use aspect-oriented advices to create our "classes".

// Let's create one more mixin:
var Sick = dcl(Person, {
  speak: dcl.advise({
    before: function(msg){
      console.log(this.name + ": *hiccup* *hiccup*");
    },
    after: function(args, result){
      console.log(this.name + ": *sniffle* I am sick!");
    }
  })
});

// Now we can create Sick Talker.
var SickTalker = dcl([Talker, Sick], {});

// `Person Clara is created`
var clara = new SickTalker("Clara");

// `Clara: *hiccup* *hiccup*`<br>
// `Clara: I want a glass of water!`<br>
// `Clara: *sniffle* I am sick!`
clara.speak("I want a glass of water!");

// Hmm, both `Talker` and `Sick` require the same "class" `Person`. How is it going to work? Don't worry,
// all duplicates are going to be eliminated by the underlying C3 MRO algorithm. Read all about it in the documentation.

// Of course we can use an "around" advice as well, and it will behave just like a super call above. It will require
// the same double function technique to inject a method from a super class.

// One more mixin:
var Martian = dcl(Speaker, {
  speak: dcl.around(function(sup){
    return function(msg){
      if(sup){
        sup.call(this, "beep-beep-beep");
      }
    };
  })
});

// Now we are ready for...
var SickMartianSarge = dcl([Sarge, Sick, Martian], {});

// `Person Don is created`
var don = new SickMartianSarge("Don");

// `Don: *hiccup* *hiccup*`<br>
// `Don: BEEP-BEEP-BEEP`<br>
// `Don: *sniffle* I am sick!`
don.speak("Doctor? Nurse? Anybody?");

// For convenience, `dcl` provides shortcuts for singular advices. Read all about it in documentation.

// ## Chaining

// While constructors are chained by default you can chain any method you like. Usually it works well for lifecycle
// methods, and event-like methods.

// Waker-upper and sleeper:
var BioOrganism = dcl(null, {});
dcl.chainAfter(BioOrganism, "wakeUp");
dcl.chainBefore(BioOrganism, "sleep");

// Now `wakeUp()` and `sleep()` are automatically chained.

// Our handy mixins:
var SwitchOperator = dcl(null, {
  wakeUp: function(){ console.log("turn on lights"); },
  sleep:  function(){ console.log("turn off lights"); }
});
var TeethBrusher = dcl(null, {
  wakeUp: function(){ console.log("brush my teeth"); },
  sleep:  function(){ console.log("brush my teeth again"); }
});
var SmartDresser = dcl(null, {
  wakeUp: function(){ console.log("dress up for work"); },
  sleep:  function(){ console.log("switch to pajamas"); }
});

// All together now:
var OfficeWorker = dcl([
    BioOrganism, SwitchOperator,
    TeethBrusher, SmartDresser],
  {}
);

var ethel = new OfficeWorker();

// Ethel's morning ritual:<br>
// `turn on lights`<br>
// `brush my teeth`<br>
// `dress up for work`
ethel.wakeUp();

// Ethel's evening ritual:<br>
// `switch to pajamas`<br>
// `brush my teeth again`<br>
// `turn off lights`
ethel.sleep();

// As you can see chaining allows to do our ritual actions in the correct order. So we don't need to worry for Ethel
// to brush her teeth in a dark.

// ## Advising objects

// While class-level AOP is static, we can always advise any method dynamically, and unadvise it at will.

// Let's implement the previous example with object-level AOP.
// For that we need to use a new module:
var advise = require("dcl/advise");

// Let's use a one-off class this time:
var fred = new (dcl(null, {
  wakeUp: function(){ /* nothing */ },
  sleep:  function(){ /* nothing */ }
}))();

var wakeAd1 = advise(fred, "wakeUp", {
  before: function(){ console.log("turn on lights"); }
});
var wakeAd2 = advise(fred, "wakeUp", {
  before: function(){ console.log("brush my teeth"); }
});
var wakeAd3 = advise(fred, "wakeUp", {
  before: function(){ console.log("dress up for work"); }
});

// Notice that after advices attached in the reverse order.
var sleepAd1 = advise(fred, "sleep", {
  after: function(){ console.log("switch to pajamas"); }
});
var sleepAd2 = advise(fred, "sleep", {
  after: function(){ console.log("brush my teeth again"); }
});
var sleepAd3 = advise(fred, "sleep", {
  after: function(){ console.log("turn off lights"); }
});

// Outputs:<br>
// `turn on lights`<br>
// `brush my teeth`<br>
// `dress up for work`
fred.wakeUp();

// Outputs:<br>
// `switch to pajamas`<br>
// `brush my teeth again`<br>
// `turn off lights`
fred.sleep();

// Let's save on electricity:
wakeAd1.unadvise();
// Brushing teeth more than once a day is overrated, right?
sleepAd1.unadvise();
// No need to dress up for work either --- our Fred is CEO!
wakeAd3.unadvise();

// Outputs:<br>
// `brush my teeth`
fred.wakeUp();

// Outputs:<br>
// `switch to pajamas`<br>
// `turn off lights`
fred.sleep();

// Again, for convenience, `dcl/advise` provides shortcuts for singular advices. Read all about it in the documentation.

// Naturally "around" advices use the same double function technique to be super light-weight.

// ## Debugging helpers

// There is a special module `dcl/debug` that adds better error checking and reporting for your "classes" and objects.
// All you need is to require it, and it will plug right in:

var dclDebug = require("dcl/debug");

// In order to use it to its fullest, we should include a static class id in our "class" definitions like so:

var OurClass = dcl(null, {
  declaredClass: "OurClass"
  // The rest of definitions goes there. It is skipped here for simplicity.
});

// It is strongly suggested to specify `declaredClass` for every declaration in every real project.

// This `declaredClass` can be any unique string, but by convention it should be a human-readable name of your "class",
// which possibly indicate where this class can be found.

// For example, if you follow the convention "one class per file" it can be something like
// `"myProject/SubDir/FileName"`. If you define several "classes" per file you can use
// a following schema: `"myProject/SubDir/FileName/ClassName"`.

// Remember that this name is for you and users of your code, it will be reported in error messages and logs.
// Yes, logs. The debug module can log constructors and objects created by those constructors.

var A = dcl(null, {
  declaredClass: "A",
  sleep: dcl.after(function(){
    console.log("*zzzzzzzzzzzzz*");
  })
});

var B = dcl(A, {
  declaredClass: "B",
  sleep: function(){
    console.log("Time to hit the pillow!");
  }
});

var george = new B();
advise.after(george, "sleep", function(){
  console.log("*ZzZzZzZzZzZzZ*")
});

// Outputs:<br>
// `Time to hit the pillow!`<br>
// `*zzzzzzzzzzzzz*`<br>
// `*ZzZzZzZzZzZzZ*`
george.sleep();

// Now we can inspect all our objects:

// Outputs:<br>
// `*** class A depends on 0 classes`<br>
// `    class method constructor is CHAINED AFTER (length: 0)`<br>
// `    class method sleep is UNCHAINED BUT CONTAINS ADVICE(S),`<br>
// `      and has an AOP stub (before: 0, around: 0, after: 1)`
dclDebug.log(A);

// Outputs:<br>
// `*** class B depends on 1 classes`<br>
// `    dependencies: A`<br>
// `    class method constructor is CHAINED AFTER (length: 0)`<br>
// `    class method sleep is UNCHAINED BUT CONTAINS ADVICE(S),`<br>
// `      and has an AOP stub (before: 0, around: 1, after: 1)`
dclDebug.log(B);

// Outputs:<br>
// `*** object of class B`<br>
// `*** class B depends on 1 classes`<br>
// `    dependencies: A`<br>
// `    class method constructor is CHAINED AFTER (length: 0)`<br>
// `    class method sleep is UNCHAINED BUT CONTAINS ADVICE(S),`<br>
// `      and has an AOP stub (before: 0, around: 1, after: 1)`<br>
// `    object method sleep has an AOP stub (before: 0, around: 1, after: 2)`
dclDebug.log(george);

// This way we can always know that we generated correct classes, inspect static chaining and advices,
// and even can monitor dynamically attached/removed advices.

// ## Summary

// Now you know what `dcl` can do for you. For more details, please read the documentation.

// Additionally `dcl` provides a small library of predefined base classes, mixins, and useful advices.
// Check them out too.

// Happy hacking!
