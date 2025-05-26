const MinimaxStrategy = require('./MinimaxStrategy');
const RandomStrategy = require('./RandomStrategy');

/**
 * @class AIFactory
 * @description Factory para crear estrategias de IA
 * @implements {Factory Pattern}
 */
class AIFactory {
    /**
     * Crea una nueva instancia de estrategia de IA
     * @param {string} strategyType - Tipo de estrategia ('minimax' o 'random')
     * @returns {IAIStrategy} - Instancia de la estrategia seleccionada
     */
    static createAI(strategyType = 'minimax') {
        switch (strategyType.toLowerCase()) {
            case 'random':
                return new RandomStrategy();
            case 'minimax':
            default:
                return new MinimaxStrategy();
        }
    }
}

module.exports = AIFactory; 