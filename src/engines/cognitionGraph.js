export class CognitionGraph {
  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  addNode(node) {
    if (!node || !node.id) {
      return;
    }
    const exists = this.nodes.some(n => n.id === node.id);
    if (!exists) {
      this.nodes.push(node);
    }
  }

  connect(source, target, weight = 1) {
    if (!source || !target) {
      return;
    }
    this.edges.push({ source, target, weight });
  }

  serialize() {
    return {
      nodes: this.nodes,
      edges: this.edges,
      generatedAt: new Date().toISOString()
    };
  }
}

export class FinancialCognitionGraph {
  beliefs = [];
  biases = [];
  emotions = [];
  decisions = [];
  outcomes = [];
  connections = [];

  connect(from, to) {
    const edge = {
      source: from,
      target: to
    };
    this.connections.push(edge);
    return edge;
  }
}
