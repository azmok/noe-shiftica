import { describe, it, expect } from 'vitest'
import { splitSqlStatements } from '../../scripts/lib/splitSqlStatements'

describe('splitSqlStatements', () => {
  it('splits top-level statements and drops empty ones', () => {
    expect(splitSqlStatements('\n  ALTER TABLE "a" ADD COLUMN "x" int;\n  ALTER TABLE "b" ADD COLUMN "y" int;\n')).toEqual([
      'ALTER TABLE "a" ADD COLUMN "x" int',
      'ALTER TABLE "b" ADD COLUMN "y" int',
    ])
  })

  it('keeps semicolons inside dollar quotes, strings, identifiers and comments', () => {
    const sql = [
      `DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "u" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$;`,
      `INSERT INTO t (v) VALUES ('a;b''c');`,
      `CREATE TABLE "we;ird" (id int);`,
      `-- comment; not a statement`,
      `/* block; comment */ SELECT 1`,
    ].join('\n')
    expect(splitSqlStatements(sql)).toEqual([
      `DO $$ BEGIN ALTER TABLE "media" ADD COLUMN "u" varchar; EXCEPTION WHEN duplicate_column THEN NULL; END $$`,
      `INSERT INTO t (v) VALUES ('a;b''c')`,
      `CREATE TABLE "we;ird" (id int)`,
      `-- comment; not a statement\n/* block; comment */ SELECT 1`,
    ])
  })

  it('handles tagged dollar quotes', () => {
    expect(splitSqlStatements('CREATE FUNCTION f() RETURNS int AS $body$ SELECT 1; $body$ LANGUAGE sql; SELECT 2')).toEqual([
      'CREATE FUNCTION f() RETURNS int AS $body$ SELECT 1; $body$ LANGUAGE sql',
      'SELECT 2',
    ])
  })

  it('drops comment-only chunks', () => {
    expect(splitSqlStatements('SELECT 1;\n-- trailing note\n')).toEqual(['SELECT 1'])
  })
})
