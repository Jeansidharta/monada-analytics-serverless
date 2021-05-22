import { Submission } from '../models/submission';
import { sheetsColumnsName } from './sheet-column-names';

export function submissionToSpreadsheetRow(submission: Submission, isDbStreamRecord: boolean) {
	function extractObjectIntoArray(object: any, keys: any[]) {
		const values: any[] = [];
		keys.forEach(key => {
			const keyName = typeof key === 'object' ? key.keyName : key;
			const rawValue = object[keyName];

			if (typeof rawValue === 'undefined') return values.push('');

			let value: any;
			if (isDbStreamRecord) {
				value = Object.values(rawValue)[0];
				if (value === undefined) throw new Error('Expected object value in dbStreamRecord');
			} else {
				value = rawValue;
			}
			if (typeof key === 'object') {
				extractObjectIntoArray(value, key.columns).forEach(elem => values.push(elem));
			} else {
				values.push(value);
			}
			return;
		});
		return values;
	}
	return extractObjectIntoArray(submission, sheetsColumnsName) as string[];
}
