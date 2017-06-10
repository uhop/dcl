(function(_,f){window.advise=f();})
([], function () {
	'use strict';

	var pname = 'prototype';

	function Node (parent) {
		this.parent = parent || this;
	}

	Node[pname] = {
		removeTopic: function (topic) {
			var n = 'next_' + topic, p = 'prev_' + topic;
			if (this[n] && this[p]) {
				this[n][p] = this[p];
				this[p][n] = this[n];
			}
		},
		remove: function () {
			this.removeTopic('before');
			this.removeTopic('around');

			// remove & recreate around advices
			var parent = this.parent, next = this.next_around;
			this.removeTopic('after');
			for (; next && next !== parent; next = next.next_around) {
				next.around = next.originalAround(next.prev_around.around);
			}
		},
		addTopic: function (node, topic) {
			var n = 'next_' + topic, p = 'prev_' + topic,
				prev = node[p] = this[p] || this;
			node[n] = this;
			prev[n] = this[p] = node;
		},
		addAdvice: function (advice, instance, name, type) {
			var node = new Node(this);
			if (advice.before) {
				node.before = advice.before;
				this.addTopic(node, 'before');
			}
			if (advice.around) {
				if (typeof advice.around != 'function') {
					advise._error('wrong super call', instance, name, type);
				}
				node.originalAround = advice.around;
				this.addTopic(node, 'around');
				if (node.prev_around.around && typeof node.prev_around.around != 'function') {
					advise._error('wrong super arg', instance, name, type);
				}
				node.around = advice.around(node.prev_around.around || null);
				if (typeof node.around != 'function') {
					advise._error('wrong super result', instance, name, type);
				}
			}
			if (advice.after) {
				node.after = advice.after;
				this.addTopic(node, 'after');
			}
			return node;
		}
	};

	Node[pname].destroy = Node[pname].unadvise = Node[pname].remove;

	function addNode (root, topic) {
		return function (f) {
			var node = new Node(root);
			node[topic] = f;
			root.addTopic(node, topic);
		};
	}

	function makeStub (value) {
		var root = new Node();
		if (value) {
			if (typeof value.advices == 'object') {
				var advices = value.advices;
				advices.before.forEach(addNode(root, 'before'));
				advices.after. forEach(addNode(root, 'after'));
				advices.around && addNode(root, 'around')(advices.around);
			} else {
				addNode(root, 'around')(value);
			}
		}
		function stub () {
			var result, thrown, p;
			// running the before chain
			for (p = root.prev_before; p && p !== root; p = p.prev_before) {
				p.before.apply(this, arguments);
			}
			// running the around chain
			if (root.prev_around && root.prev_around !== root) {
				try {
					result = root.prev_around.around.apply(this, arguments);
				} catch (error) {
					result = error;
					thrown = true;
				}
			}
			// running the after chain
			for (p = root.next_after; p && p !== root; p = p.next_after) {
				p.after.call(this, arguments, result, makeReturn, makeThrow);
			}
			if (thrown) {
				throw result;
			}
			return result;

			function makeReturn (value) { result = value; thrown = false; }
			function makeThrow  (value) { result = value; thrown = true; }
		};
		stub.node = root;
		return stub;
	}

	function convert (value, advice, instance, name, type) {
		if (!value || !(value.node instanceof Node)) {
			value = makeStub(value);
			value.node.instance = instance;
			value.node.name = name;
			value.node.type = type;
		}
		var node = value.node.addAdvice(advice, instance, name, type);
		return {value: value, handle: node};
	}

	function combineHandles (handles) {
		var handle = {
			remove: function () {
				handles.forEach(function (handle) { handle.remove(); });
			}
		}
		handle.unadvise = handle.remove;
		return handle;
	}

	function advise (instance, name, advice) {
		var prop = getPropertyDescriptor(instance, name), handles = [];
		if (prop) {
			if (prop.get || prop.set) {
				var result;
				if (prop.get && advice.get) {
					result = convert(prop.get, advice.get, instance, name, 'get');
					prop.get = result.value;
					handles.push(result.handle);
				}
				if (prop.set && advice.set) {
					result = convert(prop.set, advice.set, instance, name, 'set');
					prop.set = result.value;
					handles.push(result.handle);
				}
			} else {
				if (prop.value && advice) {
					result = convert(prop.value, advice, instance, name, 'value');
					prop.value = result.value;
					handles.push(result.handle);
				}
			}
		} else {
			prop = {writable: true, configurable: true, enumerable: true};
			if (advice.get || advice.set) {
				if (advice.get) {
					result = convert(null, advice.get, instance, name, 'get');
					prop.get = result.value;
					handles.push(result.handles);
				}
				if (advice.set) {
					result = convert(null, advice.set, instance, name, 'set');
					prop.set = result.value;
					handles.push(result.handles);
				}
			} else {
				result = convert(null, advice, instance, name, 'value');
				prop.value = result.value;
				handles.push(result.handles);
			}
		}
		Object.defineProperty(instance, name, prop);
		return combineHandles(handles);
	}

	// export

	// guts, do not use them!
	advise._error = function (msg) {
		throw new Error(msg);
	};

	advise.before = function (instance, name, f) { return advise(instance, name, {before: f}); };
	advise.after  = function (instance, name, f) { return advise(instance, name, {after:  f}); };
	advise.around = function (instance, name, f) { return advise(instance, name, {around: f}); };
	advise.Node = Node;

	return advise;

	// copied from dcl.js so we can be independent
	function getPropertyDescriptor (o, name) {
		while (o && o !== Object[pname]) {
			if (o.hasOwnProperty(name)) {
				return Object.getOwnPropertyDescriptor(o, name);
			}
			o = Object.getPrototypeOf(o);
		}
		return; // undefined
	}
});
