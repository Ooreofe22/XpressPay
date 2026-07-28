'use client'

import React, { useState } from 'react'
import { Search, Send, Smartphone, Building2 } from 'lucide-react'
import { useApp } from '@/context/AppContext'
import { formatCurrency } from '@/lib/utils'

export function SearchScreen() {
  const { bankContacts, transactions } = useApp()
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContacts = bankContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.accountNumber.includes(searchQuery)
  )

  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.recipient && transaction.recipient.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const hasResults = searchQuery.length > 0

  return (
    <div className="min-h-screen bg-background">
      {/* Search Bar */}
      <div className="sticky top-0 bg-background border-b border-card-border z-10">
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contacts, transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-card border border-card-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground text-center">
              Search for contacts or transactions
            </p>
          </div>
        ) : (
          <>
            {/* Contacts Section */}
            {filteredContacts.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                  Contacts
                </h3>
                <div className="space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border border-card-border hover:border-primary transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={contact.avatar}
                          alt={contact.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-foreground font-medium">{contact.name}</p>
                          <p className="text-xs text-muted-foreground">{contact.bankName}</p>
                        </div>
                      </div>
                      <Send className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transactions Section */}
            {filteredTransactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">
                  Transactions
                </h3>
                <div className="space-y-2">
                  {filteredTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 bg-card rounded-lg border border-card-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'sent' ? 'bg-red-50' : 'bg-green-50'
                        }`}>
                          {transaction.type === 'received' ? (
                            <Smartphone className={`w-5 h-5 ${transaction.type === 'received' ? 'text-credit' : 'text-muted-foreground'}`} />
                          ) : (
                            <Send className={`w-5 h-5 ${transaction.type === 'sent' ? 'text-debit' : 'text-muted-foreground'}`} />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-muted-foreground">{transaction.reference}</p>
                        </div>
                      </div>
                      <p className={`font-semibold text-sm ${
                        transaction.type === 'received' ? 'text-credit' : 'text-debit'
                      }`}>
                        {transaction.type === 'received' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasResults && filteredContacts.length === 0 && filteredTransactions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground text-center">
                  No results found for &quot;{searchQuery}&quot;
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
