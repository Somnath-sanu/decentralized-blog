/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/counter.json`.
 */
export type Counter = {
  "address": "FpsfKtSsRGMnZBWd6mF3yVQdpWWJx5btjygt8YNAUTj3",
  "metadata": {
    "name": "counter",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createBlogEntry",
      "discriminator": [
        49,
        38,
        245,
        188,
        173,
        155,
        102,
        157
      ],
      "accounts": [
        {
          "name": "blogEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "arg",
                "path": "title"
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "weeklyPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  101,
                  101,
                  107,
                  108,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  100,
                  97,
                  116,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "ipfsHash",
          "type": "string"
        },
        {
          "name": "poolContribution",
          "type": "u64"
        }
      ]
    },
    {
      "name": "declareWinner",
      "discriminator": [
        140,
        135,
        197,
        50,
        9,
        23,
        4,
        80
      ],
      "accounts": [
        {
          "name": "weeklyPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  101,
                  101,
                  107,
                  108,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  100,
                  97,
                  116,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "winnerBlog"
        },
        {
          "name": "winner",
          "writable": true
        },
        {
          "name": "creatorWallet",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initializePool",
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "weeklyPool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  119,
                  101,
                  101,
                  107,
                  108,
                  121,
                  95,
                  112,
                  111,
                  111,
                  108,
                  95,
                  100,
                  97,
                  116,
                  97
                ]
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "blogEntryState",
      "discriminator": [
        32,
        194,
        56,
        21,
        2,
        166,
        32,
        91
      ]
    },
    {
      "name": "weeklyPool",
      "discriminator": [
        3,
        195,
        44,
        82,
        96,
        32,
        221,
        165
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "noEntries",
      "msg": "No entries found in the pool"
    },
    {
      "code": 6001,
      "name": "spinTooEarly",
      "msg": "You must wait 7 days between winner declarations"
    },
    {
      "code": 6002,
      "name": "invalidWinner",
      "msg": "Chosen winner does not match any blog entry"
    },
    {
      "code": 6003,
      "name": "winnerMismatch",
      "msg": "Winner pubkey doesn't match blog owner"
    }
  ],
  "types": [
    {
      "name": "blogEntryState",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "ipfsHash",
            "type": "string"
          },
          {
            "name": "randomNumber",
            "type": "u32"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "tip",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "weeklyPool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "totalPool",
            "type": "u64"
          },
          {
            "name": "totalEntries",
            "type": "u64"
          },
          {
            "name": "lastWinnerNumber",
            "type": "u32"
          },
          {
            "name": "lastSpinTimestamp",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
