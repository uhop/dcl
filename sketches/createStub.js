function createStub (aroundStub, beforeStub, afterStub) {
	var stub;
	// let's generate all 8 permutations for efficiency
	if (aroundStub) {
		if (beforeStub) {
			if (afterStub) {
				stub = function full () {
					var result, thrown;
					// running the before chain
					beforeStub.apply(this, arguments);
					// running the around chain
					try {
						result = aroundStub.apply(this, arguments);
					} catch (error) {
						result = error;
						thrown = true;
					}
					// running the after chain
					afterStub.call(this, arguments, result,
						function makeReturn (value) { result = value; thrown = false; },
						function makeThrow  (value) { result = value; thrown = true; }
					);
					if (thrown) {
						throw result;
					}
					return result;
				};
			} else {
				stub = function before_around () {
					// running the before chain
					beforeStub.apply(this, arguments);
					// running the around chain
					return aroundStub.apply(this, arguments);
				};
			}
		} else {
			if (afterStub) {
				stub = function around_after () {
					var result, thrown;
					// running the around chain
					try {
						result = aroundStub.apply(this, arguments);
					} catch (error) {
						result = error;
						thrown = true;
					}
					// running the after chain
					afterStub.call(this, arguments, result,
						function makeReturn (value) { result = value; thrown = false; },
						function makeThrow  (value) { result = value; thrown = true; }
					);
					if (thrown) {
						throw result;
					}
					return result;
				};
			} else {
				stub = aroundStub;
			}
		}
	} else {
		if (beforeStub) {
			if (afterStub) {
				stub = function before_after () {
					// running the before chain
					beforeStub.apply(this, arguments);
					// running the after chain
					var result, thrown;
					afterStub.call(this, arguments, result,
						function makeReturn (value) { result = value; thrown = false; },
						function makeThrow  (value) { result = value; thrown = true; }
					);
					if (thrown) {
						throw result;
					}
					return result;
				};
			} else {
				stub = beforeStub;
			}
		} else {
			if (afterStub) {
				stub = function after () {
					// running the after chain
					var result, thrown;
					afterStub.call(this, arguments, result,
						function makeReturn (value) { result = value; thrown = false; },
						function makeThrow  (value) { result = value; thrown = true; }
					);
					if (thrown) {
						throw result;
					}
					return result;
				};
			} else {
				stub = function nop () {};
			}
		}
	}
	stub.advices = {around: aroundStub, before: beforeStub, after: afterStub};
	return stub;
}
