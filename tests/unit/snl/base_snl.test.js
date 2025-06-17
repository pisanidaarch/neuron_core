// tests/unit/snl/base_snl.test.js

const BaseSNL = require('../../../src/data/snl/base_snl');

describe('BaseSNL', () => {
    let baseSNL;

    beforeEach(() => {
        baseSNL = new BaseSNL();
    });

    describe('validateCommand', () => {
        it('should accept valid commands', () => {
            const validCommands = ['set', 'list', 'view', 'search', 'match', 'remove', 'drop', 'tag', 'untag', 'audit'];

            validCommands.forEach(command => {
                expect(() => baseSNL.validateCommand(command)).not.toThrow();
            });
        });

        it('should reject invalid commands', () => {
            const invalidCommands = ['one', 'create', 'update', 'insert', 'delete', 'add', 'modify'];

            invalidCommands.forEach(command => {
                expect(() => baseSNL.validateCommand(command)).toThrow(`Invalid command: ${command}`);
            });
        });
    });

    describe('validateEntityType', () => {
        it('should accept valid entity types', () => {
            const validTypes = ['enum', 'structure', 'pointer', 'ipointer'];

            validTypes.forEach(type => {
                expect(() => baseSNL.validateEntityType(type)).not.toThrow();
            });
        });

        it('should reject invalid entity types', () => {
            const invalidTypes = ['tag', 'all', 'document', 'json', 'text'];

            invalidTypes.forEach(type => {
                expect(() => baseSNL.validateEntityType(type)).toThrow(`Invalid entity type: ${type}`);
            });
        });
    });

    describe('escapeValue', () => {
        it('should escape double quotes in strings', () => {
            expect(baseSNL.escapeValue('Hello "World"')).toBe('Hello \\"World\\"');
        });

        it('should return non-string values as-is', () => {
            expect(baseSNL.escapeValue(123)).toBe(123);
            expect(baseSNL.escapeValue(true)).toBe(true);
            expect(baseSNL.escapeValue(null)).toBe(null);
        });
    });

    describe('buildPath', () => {
        it('should build path from components', () => {
            expect(baseSNL.buildPath('db', 'ns', 'entity')).toBe('db.ns.entity');
            expect(baseSNL.buildPath('db', 'ns')).toBe('db.ns');
            expect(baseSNL.buildPath('db')).toBe('db');
        });

        it('should handle null/undefined components', () => {
            expect(baseSNL.buildPath('db', null, 'entity')).toBe('db.entity');
            expect(baseSNL.buildPath(null, 'ns', 'entity')).toBe('ns.entity');
            expect(baseSNL.buildPath()).toBe('');
        });
    });

    describe('buildSNL', () => {
        it('should build set command correctly', () => {
            const snl = baseSNL.buildSNL('set', 'structure', ['key', { name: 'test' }], 'db.ns.entity');
            expect(snl).toBe('set(structure)\nvalues("key", {"name":"test"})\non(db.ns.entity)');
        });

        it('should build view command without values', () => {
            const snl = baseSNL.buildSNL('view', 'structure', null, 'db.ns.entity.key');
            expect(snl).toBe('view(structure)\non(db.ns.entity.key)');
        });

        it('should build list command with pattern', () => {
            const snl = baseSNL.buildSNL('list', 'enum', '*', 'db.ns');
            expect(snl).toBe('list(enum)\nvalues("*")\non(db.ns)');
        });

        it('should handle empty path', () => {
            const snl = baseSNL.buildSNL('audit', 'credits', [2025, 5]);
            expect(snl).toBe('audit(credits)\nvalues(2025, 5)\non()');
        });
    });

    describe('formatEmailForNamespace', () => {
        it('should replace dots and @ correctly', () => {
            expect(baseSNL.formatEmailForNamespace('user@example.com')).toBe('user_at_example_com');
            expect(baseSNL.formatEmailForNamespace('first.last@company.co.uk')).toBe('first_last_at_company_co_uk');
        });
    });

    describe('parseEmailFromNamespace', () => {
        it('should restore email format correctly', () => {
            expect(baseSNL.parseEmailFromNamespace('user_at_example_com')).toBe('user@example.com');
            expect(baseSNL.parseEmailFromNamespace('first_last_at_company_co_uk')).toBe('first.last@company.co.uk');
        });
    });

    describe('validateSNLSyntax', () => {
        it('should accept valid SNL commands', () => {
            const validCommands = [
                'set(structure)\nvalues("key", {})\non(db.ns.entity)',
                'view(enum)\non(main.core.dbs)',
                'list(pointer)\nvalues("*")\non()',
                'search(structure)\nvalues("term")\non(db)',
                'drop(structure)\non(db.ns.entity)'
            ];

            validCommands.forEach(command => {
                expect(() => baseSNL.validateSNLSyntax(command)).not.toThrow();
            });
        });

        it('should reject commands with invalid format', () => {
            expect(() => baseSNL.validateSNLSyntax('one(structure)\non(test)'))
                .toThrow('Invalid SNL command format');

            expect(() => baseSNL.validateSNLSyntax('set(invalid_type)\non(test)'))
                .toThrow('Invalid SNL command format');
        });

        it('should reject view/drop commands with values', () => {
            expect(() => baseSNL.validateSNLSyntax('view(structure)\nvalues("test")\non(db)'))
                .toThrow('Command view should not have values() clause');

            expect(() => baseSNL.validateSNLSyntax('drop(enum)\nvalues("*")\non(db)'))
                .toThrow('Command drop should not have values() clause');
        });

        it('should reject commands without on() clause', () => {
            expect(() => baseSNL.validateSNLSyntax('set(structure)\nvalues("key", {})')).toThrow('Missing on() clause');
        });

        it('should reject empty commands', () => {
            expect(() => baseSNL.validateSNLSyntax('')).toThrow('Empty SNL command');
            expect(() => baseSNL.validateSNLSyntax('   \n   ')).toThrow('Empty SNL command');
        });
    });
});