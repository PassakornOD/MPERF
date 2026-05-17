
import { ISarParser } from './types';
import { RHELParser } from './RHELParser';
import { SolarisParser } from './SolarisParser';

export class SarParserFactory {
  private static parsers: ISarParser[] = [
    new RHELParser(),
    new SolarisParser(),
  ];

  public static getParser(header: string): ISarParser {
    for (const parser of this.parsers) {
      if (parser.canHandle(header)) {
        return parser;
      }
    }
    throw new Error(`Unsupported SAR format: ${header.substring(0, 50)}...`);
  }
}
