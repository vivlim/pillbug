import { makeNormalizedSlice } from 'normalized-reducer';

const entityGraphSchema = {
    post: {
        accountId: {
            type: 'account',
            reciprocal: 'postIds',
            cardinality: 'one',
        },
    },
    account: {
        postIds: {
            type: 'account',
            reciprocal: 'postIds',
            cardinality: 'many',
        }
    }


}